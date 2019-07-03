#!/usr/bin/env node

const withTable = require("../lib/withTable");

require("../lib/asZeroTierAction")({
  args: "<id>",
  options: [
    ["-e, --network-id <id>", "Network's id (i.e. d3ecf5726df0ac91)"],
    ["-n, --member-name [name]", "Member's name (i.e. nexus-1)"],
    [
      "-a, --authorized [true|false]",
      "Whether the member should be authorized (default false)"
    ],
    [
      "-h, --hidden [true|false]",
      "Whether the member should be hidden (default false)"
    ],
    [
      "-i, --virtual-ips [ip1,ip2,...]",
      "Member's virtual IPs (i.e. 172.26.201.90,172.26.201.91"
    ]
  ],
  checker: commander =>
    commander.networkId &&
    commander.args[0] &&
    (commander.memberName ||
      commander.authorized ||
      commander.virtualIps ||
      commander.hidden),
  action: (commander, zerotier) =>
    zerotier
      .updateNetworkMember(commander.networkId, commander.args[0], {
        name: commander.memberName,
        hidden:
          commander.hidden === "false"
            ? false
            : commander.hidden === "true"
            ? true
            : false,
        config: {
          authorized:
            commander.authorized === "true"
              ? true
              : commander.authorized === "false"
              ? false
              : true,
          ipAssignments: commander.virtualIps && commander.virtualIps.split(",")
        }
      })
      .then(
        ({
          nodeId,
          name,
          config: { authorized, ipAssignments },
          online,
          physicalAddress
        }) =>
          withTable({
            preceedingText: "Network member successfully applied:",
            headers: [
              "ID",
              "NAME",
              "ONLINE",
              "AUTHORIZED",
              "VIRTUAL IPS",
              "PHYSICAL IP"
            ],
            data: [
              [
                nodeId,
                name,
                online,
                authorized,
                ipAssignments.join(","),
                physicalAddress
              ]
            ]
          }).then(table => console.log(table))
      )
});
