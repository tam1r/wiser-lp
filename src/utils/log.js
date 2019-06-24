const chalk = require('chalk');

const obj = (object) => {
  if (typeof object === 'object') {
    return chalk.gray(JSON.stringify(object, null, 2));
  }

  return object;
};

const success = msg => chalk.bold.green(msg);
const info = msg => chalk.bold.blue(msg);
const debug = msg => chalk.cyan(msg);
const warning = msg => chalk.bold.yellow(msg);
const error = msg => chalk.bold.red(msg);
const gray = msg => chalk.gray(msg);

module.exports = {
  info,
  success,
  warning,
  debug,
  error,
  gray,
  obj,
};
