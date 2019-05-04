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
const handleDisconnect = require('./db/utils/handleDisconnect');
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
    const { accountId } = validatedCredentials;
    const credentials = {
      accountId,
      username: validatedCredentials.username,
      password: validatedCredentials.password,
    };
    const webhooks = {
      new_conversation_webhook: validatedCredentials.new_conversation_webhook,
      new_file_in_conversation_webhook: validatedCredentials.new_file_in_conversation_webhook,
    };

    agents[accountId] = new WiserAgent(credentials, webhooks);
    res.status(200).send('Register success');
  });

  app.post('/send-message', async (req, res) => {
    const { credentials, message } = req.body;

    const validatedCredentials = await schema.validate(credentials, schemas.user)
      .catch((error) => {
        log.error(`Error validating credentials:\n${log.object(error)}`);
        res.status(400).send(error);
      });

    const validatedMessage = await schema.validate(message, schemas.message)
      .catch((error) => {
        log.error(`Error validating message:\n${log.object(error)}`);
        res.status(400).send(error);
      });

    agents[validatedCredentials.accountId].sendMessage(validatedMessage);
    res.status(200).send('Message sent');
  });

  app.get('/', (req, res) => {
    res.status(200).send('WiserLP');
  });

  app.listen(process.env.PORT || PORT, async () => {
    log.success('Server listening on port 3000!');
    agents = await initService(connection);
  });
})();
