require('dotenv').config();

const bodyParser = require('body-parser');
const express = require('express');
const morgan = require('morgan');
const axios = require('axios');
const http = require('http');

const app = express();

const { log } = require('./utils');

const PORT = 3000;

const googlePlacesHeaders = {
  'X-RapidAPI-Host': 'google-maps-geocoding.p.rapidapi.com',
  'X-RapidAPI-Key': 'e03d1dd3bdmshdd23810ade89da0p1de985jsn64527b3ffd09',
};

function keepAwake() {
  setInterval(() => {
    http.get('https://lp-freightbot.herokuapp.com/');
  }, 300000);
}

(async () => {
  app.use(morgan('tiny'));
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));

  app.post('/lp-freightbot', async (req, res) => {
    const { portOrigin, portDest } = req.body;

    if (!portOrigin) return res.status(422).send('Missing `portOrigin` parameter');
    if (!portDest) return res.status(422).send('Missing `portDest` parameter');

    let latOrigin = '';
    let lngOrigin = '';
    let latDest = '';
    let lngDest = '';
    let rate = '';
    let shippingCompany = '';
    let shippingTime = '';
    let sealine = '';
    let currency = '';

    console.log(`Received:\nportOrigin: ${portOrigin}\nportDest: ${portDest}\n`);

    // google places api call
    try {
      const portOriginURL = `https://google-maps-geocoding.p.rapidapi.com/geocode/json?language=en&address="${portOrigin}"`;
      console.log(`waiting for: ${portOriginURL}`);
      const {
        data: _portOrigin,
      } = await axios.get(portOriginURL, { headers: googlePlacesHeaders });
      latOrigin = _portOrigin.results[0].geometry.location.lat;
      lngOrigin = _portOrigin.results[0].geometry.location.lng;

      const portDestURL = `https://google-maps-geocoding.p.rapidapi.com/geocode/json?language=en&address="${portDest}"`;
      console.log(`waiting for: ${portDestURL}`);
      const {
        data: _portDest,
      } = await axios.get(portDestURL, { headers: googlePlacesHeaders });
      latDest = _portDest.results[0].geometry.location.lat;
      lngDest = _portDest.results[0].geometry.location.lng;

      console.log(`
        latOrigin: ${latOrigin}
        lngOrigin: ${lngOrigin}
        latDest: ${latDest}
        lngDest: ${lngDest}
      `);
    } catch (error) {
      return res.status(500).send({
        msg: 'Error occurred processing Google places API',
        error,
      });
    }

    // searates api call
    try {
      const baseURL = 'http://sirius.searates.com/port/api-fcl';
      const apikey = 'testJ3skfNF32nfksS93rg';
      const seaRatesURL = `${baseURL}?apiKey=${apikey}&lat_from=${latOrigin}&lng_from=${lngOrigin}&lat_to=${latDest}&lng_to=${lngDest}`;
      console.log(`waiting for ${seaRatesURL}`);

      const { data: seaRatesResponse } = await axios.get(seaRatesURL);

      rate = seaRatesResponse.rates.fcl[0]['20st'];
      sealine = seaRatesResponse.rates.fcl[0].sealine; // eslint-disable-line
      currency = seaRatesResponse.rates.fcl[0].currency; // eslint-disable-line
      shippingCompany = seaRatesResponse.rates.fcl[0].company_name;
      shippingTime = seaRatesResponse.rates.fcl[0].transit_time;
    } catch (error) {
      return res.status(500).send({
        msg: 'Error occurred processing Searates API',
        error,
      });
    }

    const response = {
      rate,
      sealine,
      currency,
      shippingCompany,
      shippingTime,
    };

    console.log(`response:\n${JSON.stringify(response)}`);

    return res.status(200).send(response);
  });

  app.get('/', (req, res) => res.status(200).send('LP-freightbot'));

  app.listen(process.env.PORT || PORT, async () => {
    log.success(`Server listening on port ${process.env.PORT || PORT}!`);
    keepAwake();
  });
})();
