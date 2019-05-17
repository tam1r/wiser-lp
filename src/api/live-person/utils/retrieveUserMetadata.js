const retrieveUserMetadata = (userProfile) => {
  let userFirstname = '';
  let userLastname = '';
  const userPhonenumber = [];

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
    });
  }

  return {
    firstname: userFirstname === '' ? 'NOT FOUND' : userFirstname,
    lastname: userLastname === '' ? 'NOT FOUND' : userLastname,
    phonenumber: userPhonenumber === '' ? 'NOT FOUND' : userPhonenumber,
  };
};

module.exports = retrieveUserMetadata;
