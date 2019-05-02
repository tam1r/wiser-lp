const Users = {
  name: 'users',
  fields: `
    id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(2048) NOT NULL,
    accountId VARCHAR(2048) NOT NULL,
    password VARCHAR(2048) NOT NULL,
    zapier_apikey VARCHAR(2048)
  `,
};

module.exports = Users;
