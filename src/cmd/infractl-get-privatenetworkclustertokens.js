#!/usr/bin/env node
const Logger = require("../lib/logger");
const PrivateNetworker = require("../lib/privateNetworker");

new (require("../lib/noun"))({
  args: "<user@ip>",
  checker: commander =>
    commander.args[0] &&
    (commander.args[0].split("@")[0] && commander.args[0].split("@")[1]),
  action: async commander => {
    const logger = new Logger();
    const privateNetworker = new PrivateNetworker();

    // Get cluster token
    const clusterToken = await privateNetworker.getClusterToken(
      commander.args[0]
    );

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
