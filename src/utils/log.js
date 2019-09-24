const chalk = require('chalk');

<<<<<<< HEAD
const obj = (object) => {
  if (typeof object === 'object') {
    return chalk.white(JSON.stringify(object, null, 2));
  }

  return object;
};

const success = msg => chalk.bold.green(msg);
const info = msg => chalk.bold.blue(msg);
const debug = msg => chalk.cyan(msg);
const warning = msg => chalk.bold.yellow(msg);
const error = msg => chalk.bold.red(msg);
const gray = msg => chalk.gray(msg);
const white = msg => chalk.white(msg);
=======
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
>>>>>>> parent of 02dbdb4... Merge branch 'master' into staging

module.exports = {
  info,
  success,
  warning,
  debug,
  error,
  gray,
  white,
  obj,
};
