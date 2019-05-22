#!/usr/bin/env node

const commander = require("commander");
const { withZeroTierConfig } = require("../lib/config");
const withZeroTierConfigCheck = require("../lib/withZeroTierConfigCheck");
const withUpsertedZeroTierNetworkAsTable = require("../lib/withUpsertedZeroTierNetworkAsTable");

commander
  .option("-n, --network-name <name>", "Network's name (i.e. skynet-1)")
  .option(
    "-p, --private",
    "Whether the network should be private (default false)"
  )
  .parse(process.argv);

commander.networkName
  ? withZeroTierConfig(config =>
      withZeroTierConfigCheck(config, config =>
        withUpsertedZeroTierNetworkAsTable({
          networkName: commander.networkName,
          private: commander.private,
          config
        }).then(table => console.log(table))
      )
    )
  : commander.outputHelp();
