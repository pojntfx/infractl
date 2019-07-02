#!/usr/bin/env node

const commander = require("commander");
const { withZeroTierConfig } = require("../lib/config");
const withZeroTierConfigCheck = require("../lib/withZeroTierConfigCheck");
const ZeroTier = require("../lib/zerotier");
const withTable = require("../lib/withTable");

commander
  .arguments("<id>")
  .option("-e, --network-id <id>", "Network's id (i.e. d3ecf5726df0ac91)")
  .option("-n, --member-name <name>", "Member's name (i.e. nexus-1)")
  .option(
    "-a, --authorized <true|false>",
    "Whether the member should be authorized (default false)"
  )
  .option(
    "-h, --hidden <true|false>",
    "Whether the member should be hidden (default false)"
  )
  .option(
    "-i, --virtual-ips <num1,num2,...>",
    "Member's virtual IPs (i.e. 172.26.201.90,172.26.201.91"
  )
  .parse(process.argv);

commander.networkId &&
commander.args[0] &&
(commander.memberName ||
  commander.authorized ||
  commander.virtualIps ||
  commander.hidden)
  ? withZeroTierConfig(config =>
      withZeroTierConfigCheck(config, config => {
        const zerotier = new ZeroTier(config);
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
              ipAssignments:
                commander.virtualIps && commander.virtualIps.split(",")
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
          );
      })
    )
  : commander.outputHelp();
