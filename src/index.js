require('dotenv').config();

const formidableMiddleware = require('express-formidable');
const bodyParser = require('body-parser');
const swagger = require('swagger-ui-express');
const Sentry = require('@sentry/node');
const express = require('express');
const signale = require('signale');
const morgan = require('morgan');
const schema = require('schm');
const http = require('http');
const docs = require('./docs/swagger.json');
const docsConfig = require('./docs/config');

const app = express();

const db = require('./db');
const { handleDisconnect, keepAlive } = require('./db/utils');
const WiserAgent = require('./api/live-person/WiserAgent');
const AgentsCluster = require('./service/AgentsCluster.js');
const schemas = require('./schemas');
const { log, isEmpty } = require('./utils');

signale.config({
  displayFilename: true,
});

if (process.env.NODE_ENV === 'production') {
  Sentry.init({ dsn: process.env.SENTRY_DSN });
}

const PORT = 3000;
let connection;

function keepAwake() {
  setInterval(() => {
    http.get('http://lpstaging.herokuapp.com/');
  }, 100000);
}

(async () => {
  connection = await db.connect();
  await db.setup(connection);

  handleDisconnect(connection);
  keepAlive(connection);
  const AgentsClusterService = new AgentsCluster(connection);

  app.use(morgan('tiny'));
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(formidableMiddleware());
  app.use('/docs', swagger.serve, swagger.setup(docs, docsConfig));

  app.delete('/unregister-client', async (req, res) => {
    let params;

    if (isEmpty(req.body)) {
      params = req.fields;
    } else {
      params = req.body;
    }

    const validatedMetadata = await schema.validate(
      params,
      schemas.user.endpoints.unregisterClient,
    ).catch((error) => {
      signale.fatal(error);
      return res.status(400).send(error);
    });

    const { accountId } = validatedMetadata;

    try {
      signale.info(`Disposing of ${accountId} account`);
      await db.removeClient(connection, accountId);

      AgentsClusterService.agents[accountId].dispose();
      delete AgentsClusterService.agents[accountId];

      signale.info(`Account ${accountId} removed from the database`);

      return res
        .contentType('application/json')
        .status(200)
        .send({
          accountId,
          msg: `Successfully removed account ${accountId}`,
        });
    } catch (error) {
      signale.fatal(error);
      return res.status(500).send(error);
    }
  });

  app.post('/register-client', async (req, res) => {
    let params;

    if (isEmpty(req.body)) {
      params = req.fields;
    } else {
      params = req.body;
    }

    const validatedCredentials = await schema.validate(
      params,
      schemas.user.model,
    ).catch((error) => {
      signale.fatal(error);
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

    signale.success(
      log.success('Successfully registered user with credentials:\n'),
      log.obj(credentials),
    );

    return res
      .contentType('application/json')
      .status(200)
      .send({ message: 'Register success', accountId });
  });

  app.put('/update-metadata', async (req, res) => {
    let params;

    if (isEmpty(req.body)) {
      params = req.fields;
    } else {
      params = req.body;
    }

    const validatedMetadata = await schema.validate(
      params,
      schemas.user.endpoints.updateMetadata,
    ).catch((error) => {
      signale.fatal(error);
      return res.status(400).send(error);
    });

    const { accountId } = validatedMetadata;

    signale.info(`Disposng of ${accountId} account`);
    AgentsClusterService.agents[accountId].dispose();

    try {
      await AgentsClusterService.updateAgent(validatedMetadata);
    } catch (error) {
      console.log(error);
      return res.status(500).send('There was an error while trying to update the Agent');
    }

    AgentsClusterService.agents[accountId].updateConf(validatedMetadata);
    AgentsClusterService.agents[accountId].init();
    const consumerId = AgentsClusterService.agents[accountId].getConsumerId();

    signale.info(`Reconnecting ${accountId} account`);

    return res
      .contentType('application/json')
      .status(200)
      .send({
        accountId,
        consumerId,
        mesage: 'Agent udpated successfully',
      });
  });

  app.post('/send-message', async (req, res) => {
    let params;

    if (isEmpty(req.body)) {
      params = req.fields;
    } else {
      params = req.body;
    }

    const { credentials, message } = params;

    const validatedCredentials = await schema.validate(credentials, schemas.user.model)
      .catch((error) => {
        signale.fatal(error);
        return res.status(400).send(error);
      });

    // validate the credentials are right

    const { liveperson_accountid: accountId } = validatedCredentials;

    const validatedMessage = await schema.validate(message, schemas.user.actions.sendMessage)
      .catch((error) => {
        signale.fatal(error);
        return res.status(400).send(error);
      });

    const response = await AgentsClusterService.agents[accountId].sendMessage(validatedMessage);
    const consumerId = AgentsClusterService.agents[accountId].getConsumerId();

    return res
      .status(response.code)
      .send({
        accountId,
        consumerId,
        ...response.message,
      });
  });

  app.get('/conversation-details', async (req, res) => {
    let params;

    if (isEmpty(req.body)) {
      params = req.fields;
    } else {
      params = req.body;
    }

    const validatedMetadata = await schema.validate(
      params,
      schemas.user.endpoints.getConversationDetails,
    ).catch((error) => {
      signale.fatal(error);
      return res.status(400).send(error);
    });

    const {
      accountId,
      convId,
    } = validatedMetadata;

    try {
      const conversationDetails = await AgentsClusterService.getConversationDetails(
        accountId,
        convId,
      );
      const consumerId = AgentsClusterService.agents[accountId].getConsumerId();

      return res
        .contentType('application/json')
        .status(200)
        .send({
          accountId,
          consumerId,
          ...conversationDetails,
        });
    } catch (error) {
      signale.fatal(error);
      return res.status(400).send({
        error,
        msg: `There is no existing open conversation with id: ${convId}`,
      });
    }
  });

  app.get('/', (req, res) => res
    .status(200)
    .send('WiserLP'));

  app.listen(process.env.PORT || PORT, async () => {
    signale.success(
      log.success(`Server listening on port ${process.env.PORT || PORT}!`),
      log.success('Documentation running under /docs'),
    );
    keepAwake();
  });
})();
