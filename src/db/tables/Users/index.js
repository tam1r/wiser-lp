const Users = {
  name: 'users',
  fields: `
    id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(2048) NOT NULL,
    liveperson_accountid VARCHAR(2048) NOT NULL,
    liveperson_appkey VARCHAR(2048) NOT NULL,
    liveperson_secret VARCHAR(2048) NOT NULL,
    liveperson_accesstoken VARCHAR(2048) NOT NULL,
    liveperson_accesstokensecret VARCHAR(2048) NOT NULL,
    zapier_apikey VARCHAR(2048)
  `,
};

module.exports = Users;
