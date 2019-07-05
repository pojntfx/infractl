const commander = require("commander");
const withArgumentCheck = require("./withArgumentCheck");
const { withHetznerCloudConfig } = require("./config");
const withHetznerCloudConfigCheck = require("./withHetznerCloudConfigCheck");
const HetznerCloud = require("./hetznerCloud");

module.exports = async ({ args, options, checker, action }) => {
  args && commander.arguments(args);
  Array.isArray(options) &&
    options.forEach(option => commander.option(...option));
  commander.parse(process.argv);
  return withArgumentCheck(
    commander,
    checker ? checker : () => true,
    commander =>
      withHetznerCloudConfig(config =>
        withHetznerCloudConfigCheck(config, config =>
          action(commander, new HetznerCloud(config), config)
        )
      )
  );
};
