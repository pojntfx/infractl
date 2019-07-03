#!/usr/bin/env node

const withTable = require("../lib/withTable");

require("../lib/asZeroTierAction")({
  args: "[id]",
  options: [
    ["-e, --network-id <id>", "Network's id (i.e. d3ecf5726df0ac91)"],
    [
      "-a, --with-hidden [true|false]",
      "Whether to show hidden network members or not (default false)"
    ]
  ],
  checker: commander => commander.networkId,
  action: (commander, zerotier) =>
    commander.args[0]
      ? zerotier
          .getNetworkMember(commander.networkId, commander.args[0])
          .then(networkMember =>
            console.log(JSON.stringify(networkMember, null, 4))
          )
      : zerotier.getNetworkMembers(commander.networkId).then(networkMembers =>
          withTable({
            headers: [
              "ID",
              "NAME",
              "ONLINE",
              "AUTHORIZED",
              "VIRTUAL IPS",
              "PHYSICAL IP"
            ],
            data: networkMembers
              .filter(({ hidden }) =>
                commander.withHidden === "true" ? true : !hidden
              )
              .map(
                ({
                  nodeId,
                  name,
                  config: { authorized, ipAssignments },
                  online,
                  physicalAddress
                }) => [
                  nodeId,
                  name,
                  online,
                  authorized,
                  ipAssignments.join(","),
                  physicalAddress
                ]
              )
          }).then(table => console.log(table))
        )
});
