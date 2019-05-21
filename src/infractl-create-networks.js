#!/usr/bin/env node

const table = require("markdown-table");
const ZeroTier = require("./zerotier");
const { getZeroTierConfig } = require("./config");
const commander = require("commander");

commander
  .option("-n, --network-name <name>", "Network's name (i.e. skynet-1)")
  .option(
    "-p, --private",
    "Whether the network should be private (default false)"
  )
  .parse(process.argv);

if (commander.networkName) {
  const config = getZeroTierConfig();
  if (config.endpoint && config.accessToken) {
    const zerotier = new ZeroTier(config);
    zerotier
      .upsertNetwork(
        undefined,
        commander.private
          ? {
              config: {
                name: commander.networkName,
                private: true
              }
            }
          : {
              config: {
                name: commander.networkName
              }
            }
      )
      .then(newNetwork => {
        console.log("New network successfully created:");
        console.log(
          table([
            ["ID", "NAME", "PRIVATE", "ONLINE MEMBERS", "AUTHORIZED MEMBERS"],
            [
              newNetwork.id,
              newNetwork.config.name,
              newNetwork.config.private,
              newNetwork.onlineMemberCount,
              newNetwork.authorizedMemberCount
            ]
          ])
        );
      });
  } else {
    console.error(
      "The networks part (ZeroTier) of infractl has not yet been set up!"
    );
  }
}
if (!commander.networkName) {
  commander.outputHelp();
}
