#!/usr/bin/env node

const ZeroTier = require("./zerotier");
const { getZeroTierConfig } = require("./config");
const commander = require("commander");
commander.arguments("<id> [otherIds...]").parse(process.argv);

const config = getZeroTierConfig();

if (config.endpoint && config.accessToken) {
  const zerotier = new ZeroTier(config);
  commander.args[0]
    ? commander.args.map(id =>
        zerotier
          .deleteNetwork(id)
          .then(() => console.log(`Network ${id} successfully deleted.`))
      )
    : commander.outputHelp();
} else {
  console.error(
    "The networks part (ZeroTier) of infractl has not yet been set up!"
  );
}
