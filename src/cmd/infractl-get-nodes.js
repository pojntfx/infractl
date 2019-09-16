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

    // Log either one or multiple nodes
    if (commander.args[0]) {
      let node = undefined;
      let nodeStatus = {};

      // Hetzner
      if (commander.args[0].split("-")[0] === "H") {
        // Check for Hetzner context
        if (!(await contexter.getHetznerContextStatus()))
          return await logger.log(
            localhost,
            "Hetzner context has not yet been set up!",
            "error"
          );

        node = await universaler.getSupracloudNode(
          "hetzner",
          await hetzner
            .getNode(
              await universaler.getProprietaryNodeId(
                "hetzner",
                commander.args[0]
              )
            )
            .then(node => {
              nodeStatus = node;
              return node;
            }),
          false
        );
      }

      // Log single node
      node || nodeStatus.error
        ? nodeStatus.error
          ? await logger.log(localhost, nodeStatus.error.message, "error")
          : console.log(DataConverter.stringify(node))
        : await logger.log(
            localhost,
            `Not a valid id, node provider prefix "${
              commander.args[0].split("-")[0]
            }" is not supported!`,
            "error"
          );
    } else {
      const nodes = (await Promise.all([
        // Hetzner
        ...(await Promise.all(
          (await universaler.getSupracloudNodeList(
            "hetzner",
            await hetzner.getNodes()
          )).map(
            async hetznerNode =>
              await universaler.getSupracloudNode("hetzner", hetznerNode, false)
          )
        ))
      ])).filter(Boolean);

      // Log all nodes
      console.log(DataConverter.stringify(nodes));
    }
  }
});
