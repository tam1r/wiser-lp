const chalk = require('chalk');

const currentTime = () => chalk.gray(`> ${(new Date()).toGMTString()} | `);
const object = (obj) => {
  if (typeof obj === 'object') {
    return JSON.stringify(obj, null, 2);
  }

  return obj;
};

const message = (msg) => {
  console.log(currentTime() + chalk.white(msg));
};

const success = (msg) => {
  console.log(currentTime() + chalk.bold.green(msg));
};

const info = (msg) => {
  console.log(currentTime() + chalk.bold.blue(msg));
};

const warning = (msg, obj = null) => {
  let _msg = `${currentTime()} ${chalk.bold.yellow(msg)}`;
  if (obj) {
    _msg += `${chalk.bold.yellow(object(obj))}`;
  }
  console.log(_msg);
};

const error = (msg, obj = null) => {
  let _msg = `${currentTime()} ${chalk.bold.red(msg)}`;
  if (obj) {
    _msg += `${chalk.bold.red(object(obj))}`;
  }
  console.log(_msg);
};

module.exports = {
  info,
  success,
  warning,
  error,
  message,
  object,
};
