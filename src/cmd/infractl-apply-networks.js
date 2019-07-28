#!/usr/bin/env node

const withTable = require("../lib/withTable");

require("../lib/asZeroTierAction")({
  args: "[id]",
  options: [
    ["-n, --network-name [name]", "Network's name (i.e. skynet-1)"],
    [
      "-p, --private [true|false]",
      "Whether the network should be private (default false)"
    ]
  ],
  checker: commander => commander.networkName || commander.private,
  action: (commander, zerotier) => {
    const defaultConfig = {
      v4AssignMode: { zt: true },
      v6AssignMode: { "6plane": true },
      ipAssignmentPools: [
        {
          ipRangeStart: "192.168.195.1",
          ipRangeEnd: "192.168.195.254"
        }
      ],
      routes: [{ target: "192.168.195.0/24", via: null, flags: 0, metric: 0 }],
      enableBroadcast: true
    };
    zerotier
      .upsertNetwork(
        commander.args[0] || undefined,
        commander.networkName
          ? commander.private === "true"
            ? {
                config: {
                  name: commander.networkName,
                  private: true,
                  ...defaultConfig
                }
              }
            : commander.private === "false"
            ? {
                config: {
                  name: commander.networkName,
                  private: false,
                  ...defaultConfig
                }
              }
            : {
                config: {
                  name: commander.networkName,
                  ...defaultConfig
                }
              }
          : commander.private === "true"
          ? {
              config: {
                private: true,
                ...defaultConfig
              }
            }
          : commander.private === "false"
          ? {
              config: {
                private: false,
                ...defaultConfig
              }
            }
          : { config: defaultConfig }
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
            headers: ["ID", "NAME", "ONLINE", "AUTHORIZED", "PRIVATE"],
            data: [
              [id, name, onlineMemberCount, authorizedMemberCount, private]
            ]
          }).then(table => console.log(table));
        }
      );
  }
});
