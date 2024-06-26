require('dotenv').config();

const formidable = require('express-formidable');
const swagger = require('swagger-ui-express');
const bodyParser = require('body-parser');
const sentry = require('@sentry/node');
const express = require('express');
const signale = require('signale');
const morgan = require('morgan');
const schema = require('schm');
const yaml = require('yamljs');
const http = require('http');
const cors = require('cors');
const path = require('path');

const docsPath = path.resolve(__dirname, './docs/swagger.yml');
const docsConfig = require('./docs/config');

const docs = yaml.load(docsPath);

const app = express();

const db = require('./db');
const {
  handleDisconnect,
  promisifyQuery,
  keepAlive,
  getClient,
} = require('./db/utils');
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
  if (process.env.NODE_ENV === 'production') {
    setInterval(() => {
      http.get('http://liveperson-zapier.herokuapp.com/');
    }, 100000);
  }
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

  app.post('/register-client', (req, res) => new Promise(async (resolve) => {
    const validatedCredentials = await schema.validate(
      req.body,
      schemas.user.model,
    ).catch((error) => {
      signale.fatal(error);
      return res.status(400).send(error);
    });

    let agent = null;
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

    const onError = () => {
      res
        .status(403)
        .send({ message: 'Invalid credentials' });
    };

    const onSuccess = () => {
      db.addClient(connection, validatedCredentials);

      signale.success(
        log.success('Successfully registered user with credentials:\n'),
        log.obj(credentials),
      );

      AgentsClusterService.agents[accountId] = agent;

      resolve(
        res
          .contentType('application/json')
          .status(200)
          .send({ message: 'Register success', accountId }),
      );
    };

    try {
      const client = await getClient(connection, accountId);
      if (client.length === 0) {
        try {
          agent = new WiserAgent(credentials, webhooks, onSuccess, onError);
        } catch (e) {
          onError();
        }
      } else {
        res
          .status(403)
          .send({ message: 'There is an existing account with that accountId!' });
      }
    } catch (error) {
      res
        .status(403)
        .send({ message: 'Something wrong happened. Status code WLP-195' });
    }
  }));
  app.post('/register-client-form', formidable(), (req, res) => new Promise(async (resolve) => {
    const validatedCredentials = await schema.validate(
      req.fields,
      schemas.user.modelForm,
    ).catch((error) => {
      signale.fatal(error);
      return res.status(400).send(error);
    });

    let agent;
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

    const onError = () => {
      res
        .status(403)
        .send({ message: 'Invalid credentials' });
    };

    const onSuccess = () => {
      // TODO: check if user with these credentials exist
      db.addClient(connection, validatedCredentials);

      signale.success(
        log.success('Successfully registered user with credentials:\n'),
        log.obj(credentials),
      );

      AgentsClusterService.agents[accountId] = agent;

      resolve(
        res
          .contentType('application/json')
          .status(200)
          .send({ message: 'Register success', accountId }),
      );
    };

    try {
      const client = await getClient(connection, accountId);
      if (client.length === 0) {
        try {
          agent = new WiserAgent(credentials, webhooks, onSuccess, onError);
        } catch (e) {
          onError();
        }
      } else {
        res
          .status(403)
          .send({ message: 'There is an existing account with that accountId!' });
      }
    } catch (error) {
      res
        .status(403)
        .send({ message: 'Something wrong happened. Status code WLP-195' });
    }
  }));

  app.put('/update-metadata', async (req, res) => {
    const validatedMetadata = await schema.validate(
      req.body,
      schemas.user.endpoints.updateMetadata,
    ).catch((error) => {
      signale.fatal(error);
      return res.status(400).send(error);
    });

    const { accountId, webhooks } = validatedMetadata;

    try {
      // TODO: authenticate before updating
      await AgentsClusterService.updateAgent(validatedMetadata);
    } catch (error) {
      signale.fatal(error);
      return res.status(500).send('There was an error while trying to update the Agent');
    }

    // AgentsClusterService.agents[accountId].updateConf(validatedMetadata);
    AgentsClusterService.agents[accountId].updateWebhooks(webhooks);
    const consumerId = AgentsClusterService.agents[accountId].getConsumerId();

    signale.info(`Successfully updated account ${accountId}`);

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
      schemas.user.endpoints.updateMetadataForm,
    ).catch((error) => {
      signale.fatal(error);
      return res.status(400).send(error);
    });

    const { accountId } = validatedMetadata;
    const webhooks = {
      new_conversation_webhook: validatedMetadata.new_conversation_webhook || null,
      new_file_in_conversation_webhook: validatedMetadata.new_file_in_conversation_webhook || null, // eslint-disable-line
      new_message_arrived_webhook: validatedMetadata.new_message_arrived_webhook || null,
      coordinates_webhook: validatedMetadata.coordinates_webhook || null,
    };
    const newMetadata = {
      ...validatedMetadata,
      webhooks,
    };

    try {
      // TODO: authenticate before updating
      await AgentsClusterService.updateAgent(newMetadata);
    } catch (error) {
      signale.fatal(error);
      return res.status(500).send('There was an error while trying to update the Agent');
    }

    try {
      // AgentsClusterService.agents[accountId].updateConf(validatedMetadata);
      const consumerId = AgentsClusterService.agents[accountId].getConsumerId();
      AgentsClusterService.agents[accountId].updateWebhooks(webhooks);

      signale.info(`Successfully updated account ${accountId}`);

      return res
        .contentType('application/json')
        .status(200)
        .send({
          accountId,
          consumerId,
          mesage: 'Agent udpated successfully',
        });
    } catch (error) {
      signale.fatal(error);
      return res.status(500).send('There was an error while trying to update the Agent');
    }
  });

  /* WIP */
  app.post('/send-message', async (req, res) => {
    const { credentials, message } = req.body;

    const validatedCredentials = await schema.validate(
      credentials,
      schemas.user.model,
    ).catch((error) => {
      signale.fatal(error);
      return res.status(400).send(error);
    });

    // TODO: validate the credentials are right

    const { liveperson_accountid: accountId } = validatedCredentials;

    const validatedMessage = await schema.validate(
      message,
      schemas.user.actions.sendMessage,
    ).catch((error) => {
      signale.fatal(error);
      return res.status(400).send(error);
    });

    try {
      const response = await AgentsClusterService.agents[accountId].sendMessage(validatedMessage);
      const consumerId = AgentsClusterService.agents[accountId].getConsumerId();

      return res
        .status(response.code)
        .send({
          accountId,
          consumerId,
          message: response.message,
        });
    } catch (error) {
      return res.status(400).send(error);
    }
  });
  app.post('/send-message-form', formidable(), async (req, res) => {
    const validatedMetadata = await schema.validate(
      req.fields,
      schemas.user.actions.sendMessageForm,
    ).catch((error) => {
      signale.fatal(error);
      return res.status(400).send(error);
    });

    // TODO: validate the credentials are right

    const { liveperson_accountid: accountId } = validatedMetadata;

    try {
      const response = await AgentsClusterService.agents[accountId].sendMessage(validatedMetadata);
      const consumerId = AgentsClusterService.agents[accountId].getConsumerId();

      return res
        .status(response.code)
        .send({
          accountId,
          consumerId,
          message: response.message,
        });
    } catch (error) {
      return res.status(400).send(error);
    }
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

  /* Admin panel endpoints */
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
  app.get('/active-conversations', async (req, res) => {
    const { accountId } = req.query;

    // TODO: implement authentication

    try {
      const conversations = await AgentsClusterService.getConversations(accountId);
      return res.status(200).send(conversations);
    } catch (error) {
      return res.status(400).send(error);
    }
  });
  app.get('/account-metadata', async (req, res) => {
    const { accountId } = req.query;

    // TODO: implement authentication

    try {
      const webhooks = AgentsClusterService.agents[accountId].getWebhooks();
      const domains = AgentsClusterService.agents[accountId].getDomains();
      const consumerId = AgentsClusterService.agents[accountId].getConsumerId();

      return res.status(200).send({
        consumerId,
        webhooks,
        domains,
      });
    } catch (error) {
      return res.status(400).send(error);
    }
  });

  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'admin-panel/build'))); // Serve any static files

    app.get('*', (req, res) => { // Handle React routing, return all requests to React app
      res.sendFile(path.join(__dirname, 'admin-panel/build', 'index.html'));
    });
  }

  app.listen(process.env.PORT || PORT, async () => {
    signale.success(
      log.success(`Server listening on port ${process.env.PORT || PORT}!`),
      log.success('Documentation running under /docs'),
    );
    keepAwake();
  });
}

wiserLP();
