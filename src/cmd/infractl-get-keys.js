#!/usr/bin/env node
const Logger = require("../lib/logger");
const Hostnamer = require("../lib/hostnamer");
const Contexter = require("../lib/contexter");
const packageJSON = require("../../package.json");
const Universaler = require("../lib/universaler");
const Hetzner = require("../lib/hetzner");
const DataConverter = require("../lib/dataConverter");

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
      let sshKeyStatus = undefined;

      // Hetzner
      if (commander.args[0].split("-")[0] === "H") {
        // Check for Hetzner context
        if (!(await contexter.getHetznerContextStatus()))
          return await logger.log(
            localhost,
            "Hetzner context has not yet been set up!",
            "error"
          );

        sshKey = await universaler.getSupracloudSSHKey(
          "hetzner",
          await hetzner
            .getSSHKey(
              await universaler.getProprietarySSHKeyId(
                "hetzner",
                commander.args[0]
              )
            )
            .then(key => {
              sshKeyStatus = key;
              return key;
            }),
          true
        );
      }

      // Log single SSH key
      sshKey
        ? sshKeyStatus.error
          ? await logger.log(localhost, sshKeyStatus.error.message, "error")
          : console.log(DataConverter.stringify(sshKey))
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
      console.log(DataConverter.stringify(sshKeys));
    }
  }
});
