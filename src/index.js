require('dotenv').config();

const bodyParser = require('body-parser');
const express = require('express');
const morgan = require('morgan');
const schema = require('schm');

const app = express();

const db = require('./db');
const livePersonServiceInit = require('./service/live-person');
const { sendMessage, connectAgent } = require('./api/live-person');
const initService = require('./initService');
const schemas = require('./schemas');
const { log } = require('./utils');

const PORT = 3000;

(async () => {
  const connection = await db.connect();
  await db.setup(connection);

  app.use(morgan('tiny'));
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));

  app.post('/register-client', async (req, res) => {
    await schema.validate(req.body, schemas.user)
      .then((credentials) => {
        // TODO: check if user with these credentials exist
        db.addClient(connection, credentials); // Add client to the database
        livePersonServiceInit(credentials); // Listen for new messages
        res.status(200).send('Success');
      }).catch((error) => {
        log.error(`Error validating credentials:\n${log.object(error)}`);
        res.status(400).send(error);
      });
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

    const agent = await connectAgent(validatedCredentials);

    await sendMessage(agent, validatedMessage);

    res.status(200).send('Message sent');

    agent.dispose();
  });

  app.listen(process.env.PORT || PORT, () => {
    log.success('Server listening on port 3000!');
    initService(connection);
  });
})();
