const chalk = require('chalk');

const currentTime = () => chalk.gray(`> ${(new Date()).toGMTString()} | `);
const object = obj => JSON.stringify(obj, null, 2);

const message = (msg) => {
  console.log(currentTime() + chalk.white(msg));
};

const success = (msg) => {
  console.log(currentTime() + chalk.bold.green(msg));
};

const info = (msg) => {
  console.log(currentTime() + chalk.bold.blue(msg));
};

const warning = (msg) => {
  console.log(currentTime() + chalk.yellow(msg));
};

const error = (msg) => {
  console.log(currentTime() + chalk.bold.red(msg));
};

module.exports = {
  info,
  success,
  warning,
  error,
  message,
  object,
};
