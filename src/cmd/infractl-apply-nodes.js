#!/usr/bin/env node
const Logger = require("../lib/logger");
const Hostnamer = require("../lib/hostnamer");
const Contexter = require("../lib/contexter");
const packageJSON = require("../../package.json");
const Universaler = require("../lib/universaler");
const Hetzner = require("../lib/hetzner");

new (require("../lib/noun"))({
  args: `[id]`,
  options: [
    ["-n, --node-name <name>", "Node's name"],
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
    const universaler = new Universaler();

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
      node = await hetzner.upsertNode(
        commander.args[0]
          ? await universaler.getProprietaryNodeId("hetzner", commander.args[0])
          : false,
        {
          name: commander.nodeName,
          location: await universaler.getProprietaryLocationId(
            "hetzner",
            commander.nodeLocation
          ),
          image: await universaler.getProprietaryOSId(
            "hetzner",
            commander.nodeOs
          ),
          server_type: await universaler.getProprietaryTypeId(
            "hetzner",
            commander.nodeType
          ),
          ssh_keys: [
            (await universaler.getSupracloudSSHKey(
              "hetzner",
              await hetzner.getSSHKey(
                await universaler.getProprietarySSHKeyId(
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
            await universaler.getSupracloudNode("hetzner", node, true, false),
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
