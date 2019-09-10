const commander = require("commander");

module.exports = class {
  constructor({ args, options, checker, action }) {
    args && commander.arguments(args);

    Array.isArray(options) &&
      options.forEach(option => commander.option(...option));

    commander.parse(process.argv);

    checker
      ? checker(commander)
        ? action(commander)
        : commander.outputHelp()
      : action(commander);
  }
};
