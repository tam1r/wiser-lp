const Users = {
  name: 'users',
  fields: `
    id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(2048) NOT NULL,
    liveperson_accountid VARCHAR(2048),
    liveperson_appkey VARCHAR(2048),
    liveperson_password VARCHAR(2048),
    liveperson_secret VARCHAR(256),
    liveperson_accesstoken VARCHAR(512),
    liveperson_accesstokensecret VARCHAR(512),
    new_conversation_webhook VARCHAR(2048),
    new_file_in_conversation_webhook VARCHAR(2048),
    new_message_arrived_webhook VARCHAR(2048),
    coordinates_webhook VARCHAR(2048)
  `,
};

module.exports = Users;
