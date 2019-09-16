#!/usr/bin/env node
const Logger = require("../lib/logger");
const Hostnamer = require("../lib/hostnamer");
const Contexter = require("../lib/contexter");
const packageJSON = require("../../package.json");

new (require("../lib/noun"))({
  options: [
    [
      "-h, --hetzner-endpoint <endpoint>",
      "Hetzner's endpoint (i.e. https://api.hetzner.cloud/v1)"
    ],
    [
      "-H, --hetzner-token <token>",
      "Hetzner's token (i.e. jEheVytlAoFl7F8MqUQ7jAo2hOXASztX)"
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

    // Log the entire context
    await logger.log(
      localhost,
      await contexter.getAll(),
      "data",
      "Successfully applied context"
    );
  }
});
