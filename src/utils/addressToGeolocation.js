const request = require('request');

function addressToGeolocation(address) {
  return new Promise(async (resolve, reject) => {
    const options = {
      method: 'GET',
      url: 'https://google-maps-geocoding.p.rapidapi.com/geocode/json',
      qs: { address: `"${address}"` },
      headers: {
        'x-rapidapi-key': 'e03d1dd3bdmshdd23810ade89da0p1de985jsn64527b3ffd09',
        'x-rapidapi-host': 'google-maps-geocoding.p.rapidapi.com',
      },
    };

    request(options, (error, response, body) => {
      const data = JSON.parse(body);

      if (data && data.results) {
        const { location } = data.results[0].geometry || null;
        resolve(location);
        return;
      }

      if (error) {
        console.log(`ERROR: ${error}`);
        reject(new Error(error));
      }
    });
  });
}

module.exports = addressToGeolocation;
