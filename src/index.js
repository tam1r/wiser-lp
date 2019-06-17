require('dotenv').config();

const bodyParser = require('body-parser');
const express = require('express');
const morgan = require('morgan');
const axios = require('axios');
const http = require('http');

const app = express();

const { log } = require('./utils');

const PORT = 3000;

const seaRatesApiKey = 'testJ3skfNF32nfksS93rg';
const seaRatesBaseURLs = {
  fcl: 'http://sirius.searates.com/port/api-fcl',
  lcl: 'https://sirius.searates.com/port/api-lcl',
  rail: 'https://sirius.searates.com/port/api-rail',
  road: 'https://sirius.searates.com/port/api-road',
  air: 'https://sirius.searates.com/port/api-air',
};

const googlePlacesHeaders = {
  'X-RapidAPI-Host': 'google-maps-geocoding.p.rapidapi.com',
  'X-RapidAPI-Key': 'e03d1dd3bdmshdd23810ade89da0p1de985jsn64527b3ffd09',
};

function keepAwake() {
  setInterval(() => {
    http.get('http://lp-freightbot.herokuapp.com/');
  }, 300000);
}

function isNull(value) {
  return value === null;
}

(async () => {
  app.use(morgan('tiny'));
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));

  app.get('/lp-freightbot', async (req, res) => {
    let {
      shippingMethod,
      portOrigin,
      portDest,
      weight,
      volume,
    } = req.body;

    if (!shippingMethod && !portOrigin && !portDest) {
      ({
        shippingMethod,
        portOrigin,
        portDest,
        weight,
        volume,
      } = req.query);
    }

    if (!shippingMethod) return res.status(422).send('Missing `shippingMethod` parameter');
    if (!portOrigin) return res.status(422).send('Missing `portOrigin` parameter');
    if (!portDest) return res.status(422).send('Missing `portDest` parameter');

    if (shippingMethod === 'lcl' || shippingMethod === 'road' || shippingMethod === 'air') {
      if (!weight) return res.status(422).send('Missing `weight` parameter');

      if (shippingMethod === 'lcl' || shippingMethod === 'road') {
        if (!volume) return res.status(422).send('Missing `volume` parameter');
      }
    }

    let latOrigin = '';
    let lngOrigin = '';
    let latDest = '';
    let lngDest = '';
    let rate = '';
    let shippingCompany = '';
    let shippingTime = '';
    let sealine = '';
    let currency = '';

    console.log(`
      Received:
      portOrigin: ${portOrigin}
      portDest: ${portDest}
      weight: ${weight || null}
      volume: ${volume || null}
    `);

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
      let seaRatesURL = `${seaRatesBaseURLs[shippingMethod]}?apiKey=${seaRatesApiKey}&lat_from=${latOrigin}&lng_from=${lngOrigin}&lat_to=${latDest}&lng_to=${lngDest}`;

      if (shippingMethod === 'lcl' || shippingMethod === 'road' || shippingMethod === 'air') {
        seaRatesURL += `weight=${weight}`;

        if (shippingMethod === 'lcl' || shippingMethod === 'road') {
          seaRatesURL += `volume=${volume}`;
        }
      }

      console.log(`waiting for ${seaRatesURL}`);

      const { data: seaRatesResponse } = await axios.get(seaRatesURL).catch(console.error);

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

    if (isNull(rate)) rate = 'Unknown';
    if (isNull(sealine)) sealine = 'Unknown';
    if (isNull(currency)) currency = 'Unknown';
    if (isNull(shippingCompany)) shippingCompany = 'Unknown';
    if (isNull(shippingTime)) shippingTime = 'Unknown';

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
