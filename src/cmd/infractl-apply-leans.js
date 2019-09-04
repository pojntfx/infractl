#!/usr/bin/env node

const Logger = require("../lib/lean/logger");
const Downloader = require("../lib/lean/downloader");
const Uploader = require("../lib/lean/uploader");
const Permissioner = require("../lib/lean/permissioner");
const Servicer = require("../lib/lean/servicer");
const Cryptographer = require("../lib/lean/cryptographer");

require("../lib/asGenericAction")({
  args: "<user@ip> [otherTargets...]",
  action: async commander => {
    // Set up logger
    const logger = new Logger();
    const localhost = `${process.env.USER}@${process.env.HOSTNAME}`;

    // Get nodes
    await logger.log(localhost, "Creating data model");
    const networkManagerNode = commander.args[0];
    const networkWorkerNodes = commander.args.filter((_, index) => index !== 0);
    const allNodes = [networkManagerNode, ...networkWorkerNodes];
    await logger.divide();

    // Download network core binary
    const downloader = new Downloader();
    await logger.log(localhost, "Download network core binary");
    const networkDriverBinarySource = await downloader.download(
      "https://nx904.your-next.cloud/s/9JSS9BsQEQTEW8E/download",
      "/tmp/wireguard-go"
    );

    // Download network interface binary
    await logger.log(localhost, "Download network interface binary");
    const networkInterfaceBinarySource = await downloader.download(
      "https://nx904.your-next.cloud/s/NLk8NdCPf4GqkZ9/download",
      "/tmp/wesher"
    );
    await logger.divide();

    // Stop network manager service
    const servicer = new Servicer();
    await logger.log(networkManagerNode, "Stopping network manager service");
    await servicer.stopService(networkManagerNode, "network-manager.service");

    // Stop network worker service
    await Promise.all(
      networkWorkerNodes.map(async node => {
        await logger.log(node, "Stopping network worker service");
        return servicer.stopService(node, "network-worker.service");
      })
    );
    await logger.divide();

    // Upload network core binary
    const uploader = new Uploader();
    await Promise.all(
      allNodes.map(async node => {
        await logger.log(node, "Uploading network core binary");
        return uploader.upload(
          networkDriverBinarySource,
          `${node}:/usr/local/bin/wireguard-go`
        );
      })
    );

    // Upload network interface binary
    await Promise.all(
      allNodes.map(async node => {
        await logger.log(node, "Uploading network interface binary");
        return uploader.upload(
          networkInterfaceBinarySource,
          `${node}:/usr/local/bin/wesher`
        );
      })
    );
    await logger.divide();

    // Set network core binary's permissions
    const permissioner = new Permissioner();
    await Promise.all(
      allNodes.map(async node => {
        await logger.log(node, "Setting permissions for network core binary");
        return permissioner.setPermissions(
          `${node}:/usr/local/bin/wireguard-go`,
          "+x"
        );
      })
    );

    // Set network interface binary's permissions
    await Promise.all(
      allNodes.map(async node => {
        await logger.log(
          node,
          "Setting permissions for network interface binary"
        );
        return permissioner.setPermissions(
          `${node}:/usr/local/bin/wesher`,
          "+x"
        );
      })
    );
    await logger.divide();

    // Create network token
    const cryptographer = new Cryptographer();
    await logger.log(localhost, "Creating network token");
    const networkToken = await cryptographer.getRandomString(32);

    // Create network manager service
    await logger.log(localhost, "Creating network manager service");
    const networkManagerServiceSource = await servicer.createService({
      description: "Overlay network daemon (manager and worker)",
      execStart: `/usr/local/bin/wesher --cluster-key ${networkToken}`,
      destination: "/tmp/network-manager.service"
    });

    // Create network worker service
    await logger.log(localhost, "Creating network worker service");
    const networkWorkerServiceSource = await servicer.createService({
      description: "Overlay network daemon (manager and worker)",
      execStart: `/usr/local/bin/wesher --cluster-key ${networkToken} --join ${
        networkManagerNode.split("@")[1]
      }`,
      destination: "/tmp/network-worker.service"
    });
    await logger.divide();

    // Upload network manager service
    await logger.log(networkManagerNode, "Uploading network manager service");
    await uploader.upload(
      networkManagerServiceSource,
      `${networkManagerNode}:/etc/systemd/system/network-manager.service`
    );

    // Upload network worker service
    await Promise.all(
      networkWorkerNodes.map(async node => {
        await logger.log(node, "Uploading network worker service");
        return uploader.upload(
          networkWorkerServiceSource,
          `${node}:/etc/systemd/system/network-worker.service`
        );
      })
    );
    await logger.divide();

    // Start network manager service
    await logger.log(networkManagerNode, "Starting network manager service");
    await servicer.startService(networkManagerNode, "network-manager.service");

    // Start network worker service
    await Promise.all(
      networkWorkerNodes.map(async node => {
        await logger.log(node, "Starting network worker service");
        return servicer.startService(node, "network-worker.service");
      })
    );
  }
});
