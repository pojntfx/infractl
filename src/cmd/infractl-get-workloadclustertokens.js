#!/usr/bin/env node
const Logger = require("../lib/logger");
const Workloader = require("../lib/workloader");

new (require("../lib/noun"))({
  args: "<user@ip>",
  checker: commander =>
    commander.args[0] &&
    (commander.args[0].split("@")[0] && commander.args[0].split("@")[1]),
  action: async commander => {
    const logger = new Logger();
    const workloader = new Workloader();

    // Get cluster token
    const clusterToken = await workloader.getClusterToken(commander.args[0]);

    // Log cluster token
    if (clusterToken) {
      console.log(clusterToken);
    } else {
      await logger.log(
        commander.args[0],
        "Workload cluster token could not be found!",
        "error"
      );
    }
  }
});
