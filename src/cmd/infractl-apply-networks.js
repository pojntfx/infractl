#!/usr/bin/env node

const withTable = require("../lib/withTable");

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
  action: (commander, zerotier) =>
    zerotier
      .upsertNetwork(
        commander.args[0] || undefined,
        commander.networkName
          ? commander.private === "true"
            ? {
                config: {
                  name: commander.networkName,
                  private: true
                }
              }
            : commander.private === "false"
            ? {
                config: {
                  name: commander.networkName,
                  private: false
                }
              }
            : {
                config: {
                  name: commander.networkName
                }
              }
          : commander.private === "true"
          ? {
              config: {
                private: true
              }
            }
          : commander.private === "false"
          ? {
              config: {
                private: false
              }
            }
          : {}
      )
      .then(
        ({
          id,
          config: { name, private },
          onlineMemberCount,
          authorizedMemberCount
        }) => {
          withTable({
            preceedingText: "Network successfully applied:",
            headers: [
              "ID",
              "NAME",
              "PRIVATE",
              "ONLINE MEMBERS",
              "AUTHORIZED MEMBERS"
            ],
            data: [
              [id, name, private, onlineMemberCount, authorizedMemberCount]
            ]
          }).then(table => console.log(table));
        }
      )
});
