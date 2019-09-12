#!/usr/bin/env node
const Logger = require("../lib/logger");
const Workloader = require("../lib/workloader");
const YAML = require("yaml");

new (require("../lib/noun"))({
  args: "<user@ip>",
  checker: commander =>
    commander.args[0] &&
    (commander.args[0].split("@")[0] && commander.args[0].split("@")[1]),
  action: async commander => {
    const logger = new Logger();
    const workloader = new Workloader();

    // Get cluster config
    const clusterConfig = await workloader.getWorkloadClusterConfig(
      commander.args[0],
      commander.args[0].split("@")[1]
    );

    // Log cluster config
    if (clusterConfig) {
      console.log(YAML.stringify(YAML.parse(clusterConfig)));
    } else {
      await logger.log(
        commander.args[0],
        "Workload cluster config could not be found!",
        "error"
      );
    }
  }
});
