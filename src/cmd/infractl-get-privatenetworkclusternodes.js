#!/usr/bin/env node
const Logger = require("../lib/logger");
const PrivateNetworker = require("../lib/privateNetworker");
const DataConverter = require("../lib/dataConverter");

new (require("../lib/noun"))({
  args: "<user@query-node-ip> [id]",
  options: [
    [
      "-t, --private-network-cluster-type [2|3]",
      "Private network clusters' type (OSI layer) (by default 3)"
    ]
  ],
  checker: commander =>
    commander.args[0] &&
    (commander.args[0].split("@")[0] && commander.args[0].split("@")[1]),
  action: async commander => {
    const logger = new Logger();
    const privateNetworker = new PrivateNetworker();

    if (commander.args[1]) {
      // Get cluster node
      const clusterNode =
        commander.privateNetworkClusterType === "2"
          ? await privateNetworker.getType2Nodes(
              commander.args[0],
              commander.args[1]
            )
          : await privateNetworker.getType3Nodes(
              commander.args[0],
              commander.args[1]
            );
      // Log cluster node
      if (clusterNode) {
        console.log(DataConverter.stringify(clusterNode));
      } else {
        await logger.log(
          commander.args[0],
          "No private network cluster node with this ID could be found!",
          "error"
        );
      }
    } else {
      // Get cluster nodes
      const clusterNodes =
        commander.privateNetworkClusterType === "2"
          ? await privateNetworker.getType2Nodes(commander.args[0])
          : await privateNetworker.getType3Nodes(commander.args[0]);
      // Log cluster nodes
      if (clusterNodes) {
        console.log(DataConverter.stringify(clusterNodes));
      } else {
        await logger.log(
          commander.args[0],
          "No private network cluster nodes could be found!",
          "error"
        );
      }
    }
  }
});
