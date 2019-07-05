const commander = require("commander");
const withArgumentCheck = require("./withArgumentCheck");

module.exports = async ({ args, options, checker, action }) => {
  args && commander.arguments(args);
  Array.isArray(options) &&
    options.forEach(option => commander.option(...option));
  commander.parse(process.argv);
  return withArgumentCheck(
    commander,
    checker ? checker : () => true,
    commander => action(commander)
  );
};
