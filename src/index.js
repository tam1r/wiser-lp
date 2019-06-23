require('dotenv').config();

const bodyParser = require('body-parser');
const swagger = require('swagger-ui-express');
const Sentry = require('@sentry/node');
const express = require('express');
const morgan = require('morgan');
const schema = require('schm');
const docs = require('./docs/swagger.json');
const docsConfig = require('./docs/config');

const app = express();

const db = require('./db');
const { handleDisconnect, keepAlive } = require('./db/utils');
const WiserAgent = require('./api/live-person/WiserAgent');
const AgentsCluster = require('./service/AgentsCluster.js');
const schemas = require('./schemas');
const { log } = require('./utils');

if (process.env.NODE_ENV === 'production') {
  Sentry.init({ dsn: process.env.SENTRY_DSN });
}

const PORT = 3000;
let connection;

(async () => {
  connection = await db.connect();
  await db.setup(connection);

  handleDisconnect(connection);
  keepAlive(connection);
  const AgentsClusterService = new AgentsCluster(connection);

  app.use(morgan('tiny'));
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use('/docs', swagger.serve, swagger.setup(docs, docsConfig));

  app.post('/unregister-client', async (req, res) => { // eslint-disable-line
    const validatedMetadata = await schema.validate(req.body, schemas.user.endpoints.unregisterClient) // eslint-disable-line
      .catch((error) => {
        log.error(`Error validating request's body:\n${log.object(error)}`);
        return res.status(400).send(error);
      });

    // TODO: remove the agent from the AgentsClusterService
    // TODO: remove account from the DB

    return res.send('Endpoint in development');
  });

  app.post('/register-client', async (req, res) => {
    const validatedCredentials = await schema.validate(req.body, schemas.user.model)
      .catch((error) => {
        log.error(`Error validating credentials:\n${log.object(error)}`);
        return res.status(400).send(error);
      });

    // TODO: check if user with these credentials exist

    // Add client to the database
    db.addClient(connection, validatedCredentials);

    // Init liveperson service for recently created user
    const accountId = validatedCredentials.liveperson_accountid;
    const { webhooks } = validatedCredentials;

    const credentials = {
      accountId,
      username: validatedCredentials.username,
      password: validatedCredentials.liveperson_password,
      appKey: validatedCredentials.liveperson_appkey,
      secret: validatedCredentials.liveperson_secret,
      accessToken: validatedCredentials.liveperson_accesstoken,
      accessTokenSecret: validatedCredentials.liveperson_accesstokensecret,
    };

    AgentsClusterService.agents[accountId] = new WiserAgent(credentials, webhooks);

    log.info(`Successfully registered user with credentials:\n ${log.object(credentials)}`);
    return res.status(200).send('Register success');
  });

  app.put('/update-metadata', async (req, res) => {
    const validatedMetadata = await schema.validate(req.body, schemas.user.endpoints.updateMetadata) // eslint-disable-line
      .catch((error) => {
        log.error(`Error validating request's body:\n${log.object(error)}`);
        return res.status(400).send(error);
      });

    // TODO: remove the agent from the AgentsClusterService
    // TODO: update values in the DB
    // TODO: re-initalize the agent's account with recently update account

    return res.send('Endpoint in development');
  });

  app.post('/send-message', async (req, res) => {
    const { credentials, message } = req.body;

    const validatedCredentials = await schema.validate(credentials, schemas.user.model)
      .catch((error) => {
        log.error(`Error validating credentials:\n${log.object(error)}`);
        return res.status(400).send(error);
      });

    const { liveperson_accountid: accountId } = validatedCredentials;

    const validatedMessage = await schema.validate(message, schemas.user.actions.sendMessage)
      .catch((error) => {
        log.error(`Error validating message:\n${log.object(error)}`);
        return res.status(400).send(error);
      });

    const response = await AgentsClusterService.agents[accountId].sendMessage(validatedMessage);

    return res.status(response.code).send(response.message);
  });

  app.get('/', (req, res) => res.status(200).send('WiserLP'));

  app.listen(process.env.PORT || PORT, async () => {
    log.success(`Server listening on port ${process.env.PORT || PORT}!`);
  });
})();
