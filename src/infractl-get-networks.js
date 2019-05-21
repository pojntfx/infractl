#!/usr/bin/env node

const table = require("markdown-table");
const ZeroTier = require("./zerotier");
const { getZeroTierConfig } = require("./config");
const commander = require("commander");
commander.parse(process.argv);

const config = getZeroTierConfig();

if (config.endpoint && config.accessToken) {
  const zerotier = new ZeroTier(config);
  commander.args[0]
    ? zerotier
        .getNetwork(commander.args[0])
        .then(network => console.log(JSON.stringify(network, null, 4)))
    : zerotier
        .getNetworks()
        .then(networks =>
          console.log(
            table([
              ["ID", "NAME", "PRIVATE", "ONLINE MEMBERS", "AUTHORIZED MEMBERS"],
              ...networks.map(
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
            ])
          )
        );
} else {
  console.error(
    "The networks part (ZeroTier) of infractl has not yet been set up!"
  );
}
