#!/usr/bin/env node
const Logger = require("../lib/logger");
const PrivateNetworker = require("../lib/privateNetworker");

new (require("../lib/noun"))({
  args: "<user@ip>",
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

    // Get cluster token
    let clusterToken = false;
    if (commander.privateNetworkClusterType === "2" ? true : false) {
      // Type 2 private network cluster
      clusterToken = await privateNetworker.getType2ClusterToken(
        commander.args[0]
      );
    } else {
      // Type 3 private network cluster
      clusterToken = await privateNetworker.getType3ClusterToken(
        commander.args[0]
      );
    }

    // Log cluster token
    if (clusterToken) {
      console.log(clusterToken);
    } else {
      await logger.log(
        commander.args[0],
        "Private network cluster token could not be found!",
        "error"
      );
    }
  }
});
