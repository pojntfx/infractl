const commander = require("commander");
const withArgumentCheck = require("./withArgumentCheck");
const { withZeroTierConfig } = require("./config");
const withZeroTierConfigCheck = require("./withZeroTierConfigCheck");
const ZeroTier = require("./zerotier");

module.exports = async ({ args, options, checker, action }) => {
  commander.arguments(args);
  Array.isArray(options) &&
    options.forEach(option => commander.option(...option));
  commander.parse(process.argv);
  return withArgumentCheck(
    commander,
    checker ? checker : () => true,
    commander =>
      withZeroTierConfig(config =>
        withZeroTierConfigCheck(config, config =>
          action(new ZeroTier(config), commander, config)
        )
      )
  );
};
