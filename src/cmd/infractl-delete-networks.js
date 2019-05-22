#!/usr/bin/env node

const commander = require("commander");
const { withZeroTierConfig } = require("../lib/config");
const withZeroTierConfigCheck = require("../lib/withZeroTierConfigCheck");
const ZeroTier = require("../lib/zerotier");

commander.arguments("<id> [otherIds...]").parse(process.argv);

commander.args[0]
  ? withZeroTierConfig(config =>
      withZeroTierConfigCheck(config, config => {
        const zerotier = new ZeroTier(config);
        commander.args.map(id =>
          zerotier
            .deleteNetwork(id)
            .then(() => console.log(`Network ${id} successfully deleted.`))
        );
      })
    )
  : commander.outputHelp();
