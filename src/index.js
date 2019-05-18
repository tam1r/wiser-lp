require('dotenv').config();

const bodyParser = require('body-parser');
const swagger = require('swagger-ui-express');
const express = require('express');
const morgan = require('morgan');
const schema = require('schm');
const docs = require('./docs/swagger.json');
const docsConfig = require('./docs/config');

const app = express();

const db = require('./db');
const { handleDisconnect, keepAlive } = require('./db/utils');
const WiserAgent = require('./api/live-person/WiserAgent');
const initService = require('./initService');
const schemas = require('./schemas');
const { log } = require('./utils');

const PORT = 3000;

let agents;
let connection;

(async () => {
  connection = await db.connect();

  await db.setup(connection);
  handleDisconnect(connection);
  keepAlive(connection);

  app.use(morgan('tiny'));
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use('/docs', swagger.serve, swagger.setup(docs, docsConfig));

  app.post('/register-client', async (req, res) => {
    const validatedCredentials = await schema.validate(req.body, schemas.user)
      .catch((error) => {
        log.error(`Error validating credentials:\n${log.object(error)}`);
        res.status(400).send(error);
      });

    // TODO: check if user with these credentials exist

    // Add client to the database
    db.addClient(connection, validatedCredentials);

    // Init liveperson service for recently created user
    const credentials = {
      username: validatedCredentials.username,
      password: validatedCredentials.liveperson_password,
      accountId: validatedCredentials.liveperson_accountid,
      appKey: validatedCredentials.liveperson_appkey,
      secret: validatedCredentials.liveperson_secret,
      accessToken: validatedCredentials.liveperson_accesstoken,
      accessTokenSecret: validatedCredentials.liveperson_accesstokensecret,
    };
    const webhooks = {
      new_conversation_webhook: validatedCredentials.new_conversation_webhook,
      new_file_in_conversation_webhook: validatedCredentials.new_file_in_conversation_webhook,
    };

    agents[validatedCredentials.liveperson_accountid] = new WiserAgent(credentials, webhooks);
    log.info(`Successfully registered user with credentials:\n ${log.object(credentials)}`);
    res.status(200).send('Register success');
  });

  app.post('/send-message', async (req, res) => {
    const { credentials, message } = req.body;

    const validatedCredentials = await schema.validate(credentials, schemas.user)
      .catch((error) => {
        log.error(`Error validating credentials:\n${log.object(error)}`);
        res.status(400).send(error);
      });

    const { liveperson_accountid: accountId } = validatedCredentials;

    const validatedMessage = await schema.validate(message, schemas.message)
      .catch((error) => {
        log.error(`Error validating message:\n${log.object(error)}`);
        res.status(400).send(error);
      });

    const response = await agents[accountId].sendMessage(validatedMessage);

    res.status(response.code).send(response.message);
  });

  app.get('/', (req, res) => {
    res.status(200).send('WiserLP');
  });

  app.listen(process.env.PORT || PORT, async () => {
    log.success('Server listening on port ' + (process.env.PORT || PORT) + '!');
    agents = await initService(connection);
  });
})();
