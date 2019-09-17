#!/usr/bin/env node
const Logger = require("../lib/logger");
const Hostnamer = require("../lib/hostnamer");
const Contexter = require("../lib/contexter");
const packageJSON = require("../../package.json");
const SupraClouder = require("../lib/supraClouder");
const Hetzner = require("../lib/hetzner");

new (require("../lib/noun"))({
  args: `[id]`,
  options: [
    ["-n, --node-name <name>", "Node's name (i.e. node-1)"],
    ["-k, --node-key [id]", "Node's key (cannot be updated)"],
    ["-l, --node-location [id]", "Node's location (cannot be updated)"],
    ["-t, --node-type [id]", "Node's type (cannot be updated)"],
    ["-o, --node-os [id]", "Node's OS (cannot be updated)"]
  ],
  checker: commander =>
    commander.args[0]
      ? commander.nodeName &&
        !commander.nodeLocation &&
        !commander.nodeOs &&
        !commander.nodeType &&
        !commander.nodeKey
      : commander.nodeName &&
        commander.nodeLocation &&
        commander.nodeOs &&
        commander.nodeType &&
        commander.nodeKey,
  action: async commander => {
    const hostnamer = new Hostnamer();
    const localhost = hostnamer.getAddress();
    const logger = new Logger();
    const contexter = new Contexter(packageJSON.name);
    const supraClouder = new SupraClouder();

    // Create clients
    const hetzner = new Hetzner({
      endpoint: await contexter.getHetznerEndpoint(),
      token: await contexter.getHetznerToken()
    });

    let node = undefined;

    // Hetzner
    if (
      commander.args[0]
        ? commander.args[0].split("-")[0] === "H"
        : commander.nodeLocation.split("-")[0] === "H"
    ) {
      // Check for Hetzner context
      if (!(await contexter.getHetznerContextStatus()))
        return await logger.log(
          localhost,
          "Hetzner context has not yet been set up!",
          "error"
        );

      node = await hetzner.upsertNode(
        commander.args[0]
          ? await supraClouder.getProprietaryNodeId(
              "hetzner",
              commander.args[0]
            )
          : false,
        {
          name: commander.nodeName,
          location: await supraClouder.getProprietaryLocationId(
            "hetzner",
            commander.nodeLocation
          ),
          image: await supraClouder.getProprietaryOSId(
            "hetzner",
            commander.nodeOs
          ),
          server_type: await supraClouder.getProprietaryTypeId(
            "hetzner",
            commander.nodeType
          ),
          ssh_keys: [
            (await supraClouder.getSupracloudSSHKey(
              "hetzner",
              await hetzner.getSSHKey(
                await supraClouder.getProprietarySSHKeyId(
                  "hetzner",
                  commander.nodeKey
                )
              ),
              false,
              true
            )).name
          ]
        }
      );
      return node.error
        ? await logger.log(localhost, node.error.message, "error")
        : await logger.log(
            localhost,
            await supraClouder.getSupracloudNode("hetzner", node, false),
            "data",
            "Successfully applied node"
          );
    } else {
      return await logger.log(
        localhost,
        `Not a valid id, node provider prefix "${
          commander.args[0].split("-")[0]
        }" is not supported!`,
        "error"
      );
    }
  }
});
