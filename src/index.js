require('dotenv').config();

const bodyParser = require('body-parser');
const express = require('express');
const morgan = require('morgan');
const schema = require('schm');

const app = express();

const db = require('./db');
const livePersonServiceInit = require('./service/live-person');
const initService = require('./initService');
const schemas = require('./schemas');
const { log } = require('./utils');

const PORT = 3000;

let agents;

(async () => {
  const connection = await db.connect();
  await db.setup(connection);

  app.use(morgan('tiny'));
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));

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
    agents[validatedCredentials.accountId] = livePersonServiceInit(validatedCredentials);

    res.status(200).send('Success');
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

  app.listen(process.env.PORT || PORT, async () => {
    log.success('Server listening on port 3000!');
    agents = await initService(connection);
  });
})();
