#!/usr/bin/env node
const Logger = require("../lib/logger");
const Hostnamer = require("../lib/hostnamer");
const Contexter = require("../lib/contexter");
const packageJSON = require("../../package.json");
const SupraClouder = require("../lib/supraClouder");
const Hetzner = require("../lib/hetzner");
const DataConverter = require("../lib/dataConverter");

new (require("../lib/noun"))({
  args: "[id]",
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

    // Log either one or multiple oses
    if (commander.args[0]) {
      let os = undefined;
      let osStatus = undefined;

      // Hetzner
      if (commander.args[0].split("-")[0] === "H") {
        // Check for Hetzner context
        if (!(await contexter.getHetznerContextStatus()))
          return await logger.log(
            localhost,
            "Hetzner context has not yet been set up!",
            "error"
          );

        os = await supraClouder.getSupracloudOS(
          "hetzner",
          await hetzner
            .getOS(
              await supraClouder.getProprietaryOSId(
                "hetzner",
                commander.args[0]
              )
            )
            .then(os => {
              osStatus = os;
              return os;
            }),
          true,
          false
        );
      }

      // Log single os
      os
        ? osStatus.error
          ? await logger.log(localhost, osStatus.error.message, "error")
          : console.log(DataConverter.stringify(os))
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
          (await supraClouder.getSupracloudOSList(
            "hetzner",
            await hetzner.getOSes()
          )).map(
            async hetznerOS =>
              await supraClouder.getSupracloudOS(
                "hetzner",
                hetznerOS,
                false,
                false
              )
          )
        ))
      ])).filter(Boolean);

      // Log all oses
      console.log(DataConverter.stringify(oses));
    }
  }
});
