#!/usr/bin/env node
const Logger = require("../lib/logger");
const Workloader = require("../lib/workloader");
const DataConverter = require("../lib/dataConverter");

new (require("../lib/noun"))({
  args: "<user@ip>",
  options: [
    [
      "-m, --additional-manager-node-ip [ip]",
      "Additional manager node's IP for the workload cluster config (i.e. 192.168.178.141) (by default the target IP will be used, which might only be reachable from within the private network cluster depending on your setup)"
    ]
  ],
  checker: commander =>
    commander.args[0] &&
    (commander.args[0].split("@")[0] && commander.args[0].split("@")[1]),
  action: async commander => {
    const logger = new Logger();
    const workloader = new Workloader();

    // Get cluster config
    const clusterConfig = await workloader.getClusterConfig(
      commander.args[0],
      commander.additionalManagerNodeIp || commander.args[0].split("@")[1]
    );

    // Log cluster config
    if (clusterConfig) {
      console.log(DataConverter.stringify(DataConverter.parse(clusterConfig)));
    } else {
      await logger.log(
        commander.args[0],
        "Workload cluster config could not be found!",
        "error"
      );
    }
  }
});
