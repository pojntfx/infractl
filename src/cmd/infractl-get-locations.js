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

    // Log either one or multiple locations
    if (commander.args[0]) {
      let location = undefined;

      // Hetzner
      if (commander.args[0].split("-")[0] === "H") {
        location = await universaler.getSupracloudLocation(
          "hetzner",
          await hetzner.getLocation(
            await universaler.getProprietaryLocationId(
              "hetzner",
              commander.args[0]
            )
          ),
          true,
          false
        );
      }

      // Log single location
      location
        ? console.log(YAML.stringify(location))
        : await logger.log(
            localhost,
            `Not a valid id, location provider prefix "${
              commander.args[0].split("-")[0]
            }" is not supported!`,
            "error"
          );
    } else {
      const locations = (await Promise.all([
        // Hetzner
        ...(await Promise.all(
          (await universaler.getSupracloudLocationList(
            "hetzner",
            await hetzner.getLocations()
          )).map(
            async hetznerLocation =>
              await universaler.getSupracloudLocation(
                "hetzner",
                hetznerLocation,
                false,
                false
              )
          )
        ))
      ])).filter(Boolean);

      // Log all locations
      console.log(YAML.stringify(locations));
    }
  }
});
