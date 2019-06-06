require('dotenv').config();

const bodyParser = require('body-parser');
const express = require('express');
const morgan = require('morgan');

const app = express();

const { log } = require('./utils');

const PORT = 3000;

(async () => {
  app.use(morgan('tiny'));
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));

  app.post('/lp-freightbot', async (req, res) => {
    const { portOrigin, portDest } = req.body;

    if (!portOrigin) return res.status(422).send('Missing `portOrigin` parameter');
    if (!portDest) return res.status(422).send('Missing `portDest` parameter');

    // Google places

    // searates

    // respond back to the one that did the request
    return res.status(200).send('Endpoint in development');
  });

  app.get('/', (req, res) => res.status(200).send('LP-freightbot'));

  app.listen(process.env.PORT || PORT, async () => {
    log.success(`Server listening on port ${process.env.PORT || PORT}!`);
  });
})();
