#!/usr/bin/env node
const Logger = require("../lib/logger");
const Hostnamer = require("../lib/hostnamer");
const Contexter = require("../lib/contexter");
const packageJSON = require("../../package.json");

new (require("../lib/noun"))({
  options: [
    [
      "-h, --hetzner-endpoint <endpoint>",
      "Hetzner endpoint (i.e. https://api.hetzner.cloud/v1)"
    ],
    [
      "-H, --hetzner-token <token>",
      "Hetzner token (i.e. jEheVytlAoFl7F8MqUQ7jAo2hOXASztX)"
    ]
  ],
  checker: commander => commander.hetznerEndpoint || commander.hetznerToken,
  action: async commander => {
    const hostnamer = new Hostnamer();
    const localhost = hostnamer.getAddress();
    const logger = new Logger();
    const contexter = new Contexter(packageJSON.name);

    // Update all new data
    if (commander.hetznerEndpoint) {
      await logger.log(localhost, "Setting Hetzner endpoint");
      await contexter.setHetznerEndpoint(commander.hetznerEndpoint);
    }
    if (commander.hetznerToken) {
      await logger.log(localhost, "Setting Hetzner token");
      await contexter.setHetznerToken(commander.hetznerToken);
    }
    await logger.divide();

    // Send positive message to user
    await logger.log(localhost, "Successfully applied context.", "done");
  }
});
