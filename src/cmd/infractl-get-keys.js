#!/usr/bin/env node
const Logger = require("../lib/logger");
const Hostnamer = require("../lib/hostnamer");
const Contexter = require("../lib/contexter");
const packageJSON = require("../../package.json");
const Universaler = require("../lib/universaler");
const Hetzner = require("../lib/hetzner");
const YAML = require("yaml");

new (require("../lib/noun"))({
  args: "[id]",
  action: async commander => {
    const hostnamer = new Hostnamer();
    const localhost = hostnamer.getAddress();
    const logger = new Logger();
    const contexter = new Contexter(packageJSON.name);
    const universaler = new Universaler();

    // Create clients
    const hetzner = new Hetzner({
      endpoint: await contexter.getHetznerEndpoint(),
      token: await contexter.getHetznerToken()
    });

    // Log either one or multiple SSH keys
    if (commander.args[0]) {
      let sshKey = undefined;

      // Hetzner
      if (commander.args[0].split("-")[0] === "H") {
        sshKey = await universaler.getSupracloudSSHKey(
          "hetzner",
          await hetzner.getSSHKey(
            await universaler.getProprietarySSHKeyId(
              "hetzner",
              commander.args[0]
            )
          ),
          true
        );
      }

      // Log single SSH key
      sshKey
        ? console.log(YAML.stringify(sshKey))
        : await logger.log(
            localhost,
            `Not a valid id, key provider prefix "${
              commander.args[0].split("-")[0]
            }" is not supported!`,
            "error"
          );
    } else {
      const sshKeys = (await Promise.all([
        // Hetzner
        ...(await Promise.all(
          (await universaler.getSupracloudSSHKeyList(
            "hetzner",
            await hetzner.getSSHKeys()
          )).map(
            async hetznerSSHKey =>
              await universaler.getSupracloudSSHKey(
                "hetzner",
                hetznerSSHKey,
                false,
                false
              )
          )
        ))
      ])).filter(Boolean);

      // Log all SSH keys
      console.log(YAML.stringify(sshKeys));
    }
  }
});
