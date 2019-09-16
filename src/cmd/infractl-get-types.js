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

    // Log either one or multiple nodeTypes
    if (commander.args[0]) {
      let nodeType = undefined;
      let nodeTypeStatus = {};

      // Hetzner
      if (commander.args[0].split("-")[0] === "H") {
        // Check for Hetzner context
        if (!(await contexter.getHetznerContextStatus()))
          return await logger.log(
            localhost,
            "Hetzner context has not yet been set up!",
            "error"
          );

        nodeType = await universaler.getSupracloudType(
          "hetzner",
          await hetzner
            .getType(
              await universaler.getProprietaryTypeId(
                "hetzner",
                commander.args[0]
              )
            )
            .then(nodeType => {
              nodeTypeStatus = nodeType;
              return nodeType;
            }),
          true,
          false
        );
      }

      // Log single nodeType
      nodeType || nodeTypeStatus.error
        ? nodeTypeStatus.error
          ? await logger.log(localhost, nodeTypeStatus.error.message, "error")
          : console.log(DataConverter.stringify(nodeType))
        : await logger.log(
            localhost,
            `Not a valid id, type provider prefix "${
              commander.args[0].split("-")[0]
            }" is not supported!`,
            "error"
          );
    } else {
      const nodeTypes = (await Promise.all([
        // Hetzner
        ...(await Promise.all(
          (await universaler.getSupracloudTypeList(
            "hetzner",
            await hetzner.getTypes()
          )).map(
            async hetznerType =>
              await universaler.getSupracloudType(
                "hetzner",
                hetznerType,
                false,
                false
              )
          )
        ))
      ])).filter(Boolean);

      // Log all nodeTypes
      console.log(DataConverter.stringify(nodeTypes));
    }
  }
});
