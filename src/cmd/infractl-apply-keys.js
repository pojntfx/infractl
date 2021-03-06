#!/usr/bin/env node
const Logger = require("../lib/logger");
const Hostnamer = require("../lib/hostnamer");
const Contexter = require("../lib/contexter");
const packageJSON = require("../../package.json");
const SupraClouder = require("../lib/supraClouder");
const Hetzner = require("../lib/hetzner");
const Cater = require("../lib/cater");

new (require("../lib/noun"))({
  args: `<id|"H-">`,
  options: [
    ["-n, --key-name <name>", "Key's name (i.e. user@ip-1)"],
    [
      "-f, --key-file [path]",
      "Key's path (i.e. ~/.ssh/id_rsa.pub) (cannot be updated)"
    ]
  ],
  checker: commander =>
    commander.args[0]
      ? commander.args[0].split(/[A-Z]\-/)[1]
        ? commander.keyName && !commander.keyFile
        : commander.keyName && commander.keyFile
      : false,
  action: async commander => {
    const hostnamer = new Hostnamer();
    const localhost = hostnamer.getAddress();
    const logger = new Logger();
    const contexter = new Contexter(packageJSON.name);
    const supraClouder = new SupraClouder();
    const cater = new Cater();

    // Create clients
    const hetzner = new Hetzner({
      endpoint: await contexter.getHetznerEndpoint(),
      token: await contexter.getHetznerToken()
    });

    let sshKey = undefined;

    // Hetzner
    if (commander.args[0].split("-")[0] === "H") {
      // Check for Hetzner context
      if (!(await contexter.getHetznerContextStatus()))
        return await logger.log(
          localhost,
          "Hetzner context has not yet been set up!",
          "error"
        );

      sshKey = await hetzner.upsertSSHKey(
        commander.args[0]
          ? await supraClouder.getProprietarySSHKeyId(
              "hetzner",
              commander.args[0]
            )
          : false,
        {
          name: commander.keyName,
          public_key: await cater.getFileContent(
            `${localhost}:${commander.keyFile}`
          )
        }
      );
      return sshKey.error
        ? await logger.log(localhost, sshKey.error.message, "error")
        : await logger.log(
            localhost,
            await supraClouder.getSupracloudSSHKey(
              "hetzner",
              sshKey,
              true,
              false
            ),
            "data",
            "Successfully applied key"
          );
    } else {
      return await logger.log(
        localhost,
        `Not a valid id, key provider prefix "${
          commander.args[0].split("-")[0]
        }" is not supported!`,
        "error"
      );
    }
  }
});
