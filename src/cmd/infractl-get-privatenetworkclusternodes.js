#!/usr/bin/env node
const Logger = require("../lib/logger");
const PrivateNetworker = require("../lib/privateNetworker");
const YAML = require("yaml");

new (require("../lib/noun"))({
  args: "<user@ip> [id]",
  checker: commander =>
    commander.args[0] &&
    (commander.args[0].split("@")[0] && commander.args[0].split("@")[1]),
  action: async commander => {
    const logger = new Logger();
    const privateNetworker = new PrivateNetworker();

    if (commander.args[1]) {
      // Get cluster node
      const clusterNode = await privateNetworker.getNodes(
        commander.args[0],
        commander.args[1]
      );
      // Log cluster node
      if (clusterNode) {
        console.log(YAML.stringify(clusterNode));
      } else {
        await logger.log(
          commander.args[0],
          "No private network cluster node with this ID could be found!",
          "error"
        );
      }
    } else {
      // Get cluster nodes
      const clusterNodes = await privateNetworker.getNodes(commander.args[0]);
      // Log cluster nodes
      if (clusterNodes) {
        console.log(YAML.stringify(clusterNodes));
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
