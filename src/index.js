require('dotenv').config();

const formidable = require('express-formidable');
const bodyParser = require('body-parser');
const swagger = require('swagger-ui-express');
const sentry = require('@sentry/node');
const express = require('express');
const signale = require('signale');
const morgan = require('morgan');
const schema = require('schm');
const http = require('http');
const cors = require('cors');
const docs = require('./docs/swagger.json');
const docsConfig = require('./docs/config');

const app = express();

const db = require('./db');
const { handleDisconnect, keepAlive, promisifyQuery } = require('./db/utils');
const WiserAgent = require('./api/live-person/WiserAgent');
const AgentsCluster = require('./service/AgentsCluster.js');
const schemas = require('./schemas');
const { log } = require('./utils');

signale.config({
  displayFilename: true,
});

if (process.env.NODE_ENV === 'production') {
  sentry.init({ dsn: process.env.SENTRY_DSN });
}

const PORT = 5000;
let connection;

function keepAwake() {
  setInterval(() => {
    http.get('http://lpstaging.herokuapp.com/');
  }, 100000);
}

async function wiserLP() {
  connection = await db.connect();
  await db.setup(connection);
  handleDisconnect(connection);

  if (process.env.NODE_ENV === 'production') {
    keepAlive(connection);
  }

  const AgentsClusterService = new AgentsCluster(connection);

  app.use(morgan('tiny'));
  app.use(cors());
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use('/docs', swagger.serve, swagger.setup(docs, docsConfig));

  app.delete('/unregister-client', async (req, res) => {
    const validatedMetadata = await schema.validate(
      req.body,
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
  app.delete('/unregister-client-form', formidable(), async (req, res) => {
    const validatedMetadata = await schema.validate(
      req.fields,
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
    const validatedCredentials = await schema.validate(
      req.body,
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
  app.post('/register-client-form', formidable(), async (req, res) => {
    const validatedCredentials = await schema.validate(
      req.fields,
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
    const validatedMetadata = await schema.validate(
      req.body,
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
      signale.fatal(error);
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
  app.put('/update-metadata-form', formidable(), async (req, res) => {
    const validatedMetadata = await schema.validate(
      req.fields,
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
      signale.fatal(error);
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
    const { credentials, message } = req.body;

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
  app.post('/send-message-form', formidable(), async (req, res) => {
    const { credentials, message } = req.fields;

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
    const validatedMetadata = await schema.validate(
      req.body,
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
  app.get('/conversation-details-form', formidable(), async (req, res) => {
    const validatedMetadata = await schema.validate(
      req.fields,
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

  app.get('/domains', async (req, res) => {
    const { accountId } = req.body;

    if (!accountId) {
      return res.status(400).send('Missing accountId parameter');
    }

    try {
      const domains = AgentsClusterService.agents[accountId].getDomains();
      const consumerId = AgentsClusterService.agents[accountId].getConsumerId();

      return res
        .contentType('application/json')
        .status(200)
        .send({
          accountId,
          consumerId,
          domains,
        });
    } catch (error) {
      signale.fatal(error);
      return res
        .status(500)
        .send({
          error,
          msg: 'Something wrong ocurred',
        });
    }
  });
  app.get('/domains-form', formidable(), async (req, res) => {
    const { accountId } = req.fields;

    if (!accountId) {
      return res.status(400).send('Missing accountId parameter');
    }

    try {
      const domains = AgentsClusterService.agents[accountId].getDomains();
      const consumerId = AgentsClusterService.agents[accountId].getConsumerId();

      return res
        .contentType('application/json')
        .status(200)
        .send({
          accountId,
          consumerId,
          domains,
        });
    } catch (error) {
      signale.fatal(error);
      return res
        .status(500)
        .send({
          error,
          msg: 'Something wrong ocurred',
        });
    }
  });

  app.post('/login', async (req, res) => {
    const validatedMetadata = await schema.validate(
      req.body,
      schemas.user.endpoints.login,
    ).catch((error) => {
      signale.fatal(error);
      return res.status(400).send(error);
    });

    const { accountId, password } = validatedMetadata;

    const results = await promisifyQuery(
      connection,
      'SELECT * FROM users WHERE liveperson_accountid = ? && liveperson_password = ?',
      [accountId, password],
    );

    if (results.length > 0) {
      const {
        id,
        liveperson_accountid,
        liveperson_appkey,
        liveperson_password,
        liveperson_secret,
        liveperson_accesstoken,
        liveperson_accesstokensecret,
        ...userData
      } = results[0];

      return res
        .status(200)
        .send({
          user: userData,
          msg: 'Login success',
        });
    }
    return res
      .status(401)
      .send({
        msg: 'Invalid credentials',
      });
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
}

wiserLP();
