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

    // Log either one or multiple oses
    if (commander.args[0]) {
      let os = undefined;

      // Hetzner
      if (commander.args[0].split("-")[0] === "H") {
        os = await universaler.getSupracloudOS(
          "hetzner",
          await hetzner.getOS(
            await universaler.getProprietaryOSId("hetzner", commander.args[0])
          ),
          true,
          false
        );
      }

      // Log single os
      os
        ? console.log(YAML.stringify(os))
        : await logger.log(
            localhost,
            `Not a valid id, os provider prefix "${
              commander.args[0].split("-")[0]
            }" is not supported!`,
            "error"
          );
    } else {
      const oses = (await Promise.all([
        // Hetzner
        ...(await Promise.all(
          (await universaler.getSupracloudOSList(
            "hetzner",
            await hetzner.getOSes()
          )).map(
            async hetznerOS =>
              await universaler.getSupracloudOS(
                "hetzner",
                hetznerOS,
                false,
                false
              )
          )
        ))
      ])).filter(Boolean);

      // Log all oses
      console.log(YAML.stringify(oses));
    }
  }
});
