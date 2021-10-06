const log = require('../../../utils/log');

const retrieveUserMetadata = (userProfile) => {
  let userFirstname = '';
  let userLastname = '';
  const userPhonenumber = [];

  log.info('User profile');
  log.info(userProfile);

  if (userProfile) {
    userProfile.forEach((dataRow) => {
      if (dataRow.type === 'personal') {
        const { personal } = dataRow;
        const { firstname, lastname, contacts } = personal;

        if (firstname) {
          userFirstname = firstname;
        }

        if (lastname) {
          userLastname = lastname;
        }

        if (contacts) {
          contacts.forEach(({ phone }) => {
            if (
              phone
              && phone !== 'null'
              && !userPhonenumber.includes(phone)
            ) {
              userPhonenumber.push(phone);
            }
          });
        }
      }

      if (
        userPhonenumber.length === 0 &&
        dataRow.type === 'ctmrinfo' &&
        !userPhonenumber.includes(dataRow.info.imei)
      ) {
        userPhonenumber.push(dataRow.info.imei);
      }
    });
  }

  const metadata = {
    firstname: userFirstname === '' ? 'NOT FOUND' : userFirstname,
    lastname: userLastname === '' ? 'NOT FOUND' : userLastname,
    phonenumber: userPhonenumber === '' ? 'NOT FOUND' : userPhonenumber,
  };

  log.info(metadata);

  return metadata;
};

module.exports = retrieveUserMetadata;
