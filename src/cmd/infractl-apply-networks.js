#!/usr/bin/env node

const commander = require("commander");
const { withZeroTierConfig } = require("../lib/config");
const withZeroTierConfigCheck = require("../lib/withZeroTierConfigCheck");
const withUpsertedZeroTierNetworkAsTable = require("../lib/withUpsertedZeroTierNetworkAsTable");

commander
  .arguments("<id>")
  .option("-n, --network-name <name>", "Network's name (i.e. skynet-1)")
  .option(
    "-p, --private <true|false>",
    "Whether the network should be private (default false)"
  )
  .parse(process.argv);

commander.networkName || commander.private
  ? withZeroTierConfig(config =>
      withZeroTierConfigCheck(config, config =>
        withUpsertedZeroTierNetworkAsTable({
          id: commander.args[0],
          networkName: commander.networkName,
          private: commander.private,
          config
        }).then(table => console.log(table))
      )
    )
  : commander.outputHelp();
