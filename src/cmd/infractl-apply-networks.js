#!/usr/bin/env node

const withUpsertedZeroTierNetworkAsTable = require("../lib/withUpsertedZeroTierNetworkAsTable");

require("../lib/asZeroTierAction")({
  args: "<id>",
  options: [
    ["-n, --network-name <name>", "Network's name (i.e. skynet-1)"],
    [
      "-p, --private <true|false>",
      "Whether the network should be private (default false)"
    ]
  ],
  checker: commander => commander.networkName || commander.private,
  action: (commander, _, config) =>
    withUpsertedZeroTierNetworkAsTable({
      id: commander.args[0],
      networkName: commander.networkName,
      private: commander.private,
      config
    }).then(table => console.log(table))
});
