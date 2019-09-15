#!/usr/bin/env no de
const Logger = require("../lib/logger");
const Hostnamer = require("../lib/hostnamer");
const Servicer = require("../lib/servicer");
const SSHer = require("../lib/ssher");

new (require("../lib/noun"))({
  args: "<user@ip> [...otherNodes]",
  checker: commander =>
    commander.args[0] &&
    (commander.args[0].split("@")[0] && commander.args[0].split("@")[1]),
  action: async commander => {
    const hostnamer = new Hostnamer();
    const localhost = hostnamer.getAddress();
    const logger = new Logger();
    const servicer = new Servicer();

    return await Promise.all(
      commander.args.map(async node => {
        // Set private network cluster services to disable
        const servicesToDisableAndDelete = [
          "private-network-cluster-manager.service",
          "private-network-cluster-worker.service"
        ];

        // Disable and delete services
        await Promise.all(
          servicesToDisableAndDelete.map(async service => {
            const ssher = new SSHer(node);
            // Disable service
            await logger.log(node, `Disabling ${service} service`);
            await servicer.disableService(node, `${service}`);
            // Delete service
            await logger.log(node, `Deleting ${service} service`);
            return await ssher.rm(
              `${node}:/etc/systemd/system/${service}`,
              false,
              true
            );
          })
        );
        await logger.divide();

        // Reload services
        await logger.log(node, "Reloading services");
        await servicer.reloadServices(node);
        await logger.divide();

        // Delete files
        const filesToDelete = [
          "/usr/local/bin/wesher",
          "/usr/local/bin/wireguard-go"
        ];
        await Promise.all(
          filesToDelete.map(async file => {
            await logger.log(node, `Deleting file ${file}`);
            const ssher = new SSHer(node);
            return await ssher.rm(`${node}:${file}`, false, true);
          })
        );
        await logger.divide();

        // Delete folders
        const foldersToDelete = ["/var/lib/wesher"];
        await Promise.all(
          foldersToDelete.map(async folder => {
            await logger.log(node, `Deleting folder ${folder}`);
            const ssher = new SSHer(node);
            return await ssher.rm(`${node}:${folder}`, true, true);
          })
        );
        await logger.divide();

        // Log positive message to user
        return await logger.log(
          localhost,
          `Successfully deleted private network cluster node ${node}.`,
          "done"
        );
      })
    );
  }
});
