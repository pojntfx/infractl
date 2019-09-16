#!/usr/bin/env node
const Logger = require("../lib/logger");
const Workloader = require("../lib/workloader");
const DataConverter = require("../lib/dataConverter");

new (require("../lib/noun"))({
  args: "<user@ip>",
  checker: commander =>
    commander.args[0] &&
    (commander.args[0].split("@")[0] && commander.args[0].split("@")[1]),
  action: async commander => {
    const logger = new Logger();
    const workloader = new Workloader();

    // Get cluster config
    const clusterConfig = await workloader.getClusterConfig(
      commander.args[0],
      commander.args[0].split("@")[1]
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
