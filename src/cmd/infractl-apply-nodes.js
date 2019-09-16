#!/usr/bin/env node
const Logger = require("../lib/logger");
const Hostnamer = require("../lib/hostnamer");
const Contexter = require("../lib/contexter");
const packageJSON = require("../../package.json");
const Universaler = require("../lib/universaler");
const Hetzner = require("../lib/hetzner");

new (require("../lib/noun"))({
  args: `<id|"H-">`,
  options: [
    ["-n, --node-name [name]", "Node's name"],
    [
      "-l, --node-location [H-ngb1|H-fsn1|H-hel1]",
      "Node's location (cannot be updated)"
    ],
    [
      "-o, --node-os [debian|centos|ubuntu|fedora]",
      "Node's OS (cannot be updated)"
    ],
    [
      "-t, --node-type [1-2-20|2-4-40|2-8-80|4-16-160|8-32-240]",
      "Node's type (cores-memory (in GB)-disk (in GB)) (cannot be updated)"
    ],
    ["-k, --node-key [name]", "Node's key's name (cannot be updated)"]
  ],
  checker: commander =>
    commander.args[0]
      ? commander.args[0].split(/[A-Z]\-/)[1]
        ? commander.nodeName &&
          !commander.nodeLocation &&
          !commander.nodeOs &&
          !commander.nodeType &&
          !commander.nodeKey
        : commander.nodeName &&
          commander.nodeLocation &&
          commander.nodeOs &&
          commander.nodeType &&
          commander.nodeKey
      : false,
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
    if (commander.args[0].split("-")[0] === "H") {
      node = await hetzner.upsertNode(
        commander.args[0]
          ? await universaler.getProprietaryNodeId("hetzner", commander.args[0])
          : false,
        {
          name: commander.nodeName,
          location: await universaler.getProprietaryLocationName(
            "hetzner",
            commander.nodeLocation
          ),
          image: await universaler.getProprietaryNodeOS(
            "hetzner",
            commander.nodeOs
          ),
          server_type: await universaler.getProprietaryNodeType(
            "hetzner",
            commander.nodeType
          ),
          ssh_keys: [
            await universaler.getProprietarySSHKeyId(
              "hetzner",
              commander.nodeKey
            )
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
