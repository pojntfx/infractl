#!/usr/bin/env node

const commander = require("commander");
const { withZeroTierConfig } = require("../lib/config");
const withZeroTierConfigCheck = require("../lib/withZeroTierConfigCheck");
const withTable = require("../lib/withTable");
const ZeroTier = require("../lib/zerotier");

commander.arguments("[id]").parse(process.argv);

withZeroTierConfig(config =>
  withZeroTierConfigCheck(config, config => {
    const zerotier = new ZeroTier(config);
    commander.args[0]
      ? zerotier
          .getNetwork(commander.args[0])
          .then(network => console.log(JSON.stringify(network, null, 4)))
      : zerotier.getNetworks().then(networks =>
          withTable({
            headers: [
              "ID",
              "NAME",
              "PRIVATE",
              "ONLINE MEMBERS",
              "AUTHORIZED MEMBERS"
            ],
            data: networks.map(
              ({
                id,
                config: { name, private },
                onlineMemberCount,
                authorizedMemberCount
              }) => [
                id,
                name,
                private,
                onlineMemberCount,
                authorizedMemberCount
              ]
            )
          }).then(table => console.log(table))
        );
  })
);
