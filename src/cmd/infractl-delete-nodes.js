#!/usr/bin/env node
const Logger = require("../lib/logger");
const Hostnamer = require("../lib/hostnamer");
const Contexter = require("../lib/contexter");
const packageJSON = require("../../package.json");
const SupraClouder = require("../lib/supraClouder");
const Hetzner = require("../lib/hetzner");

new (require("../lib/noun"))({
  args: "<id> [otherIds...]",
  checker: commander => commander.args[0],
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

    return await Promise.all(
      commander.args.map(async id => {
        if (id.split("-")[0] === "H") {
          // Check for Hetzner context
          if (!(await contexter.getHetznerContextStatus()))
            return await logger.log(
              localhost,
              "Hetzner context has not yet been set up!",
              "error"
            );

          // Hetzner
          const node = await hetzner.deleteNode(
            await supraClouder.getProprietaryNodeId("hetzner", id)
          );
          return node.status !== 200
            ? await logger.log(
                localhost,
                `${node.status} ${node.statusText}`,
                "error"
              )
            : await logger.log(
                localhost,
                `Successfully deleted node ${id}.`,
                "done"
              );
        } else {
          return await logger.log(
            localhost,
            `Not a valid id, node provider prefix "${
              id.split("-")[0]
            }" is not supported!`,
            "error"
          );
        }
      })
    );
  }
});
