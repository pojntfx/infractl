#!/usr/bin/env node

const Logger = require("../lib/lean/logger");
const Downloader = require("../lib/lean/downloader");
const OSer = require("../lib/lean/oser");
const Uploader = require("../lib/lean/uploader");
const Permissioner = require("../lib/lean/permissioner");
const Kernelr = require("../lib/lean/kernelr");
const Servicer = require("../lib/lean/servicer");
const Cryptographer = require("../lib/lean/cryptographer");
const IPer = require("../lib/lean/iper");

require("../lib/asGenericAction")({
  args: "<user@ip> [otherTargets...]",
  action: async commander => {
    // Set up logger
    const logger = new Logger();
    const localhost = `${process.env.USER}@${process.env.HOSTNAME}`;

    // Get nodes
    const networkManagerNode = commander.args[0];
    const networkWorkerNodes = commander.args.filter((_, index) => index !== 0);
    await logger.log(localhost, "Creating node data model");
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

    // Get nodes' operating system
    const oser = new OSer();
    await Promise.all(
      allNodes.map(async node => {
        await logger.log(node, "Getting node's operating system");
        const nodeOS = await oser.getOS(node);
        return true;
      })
    );

    // Disable network manager service
    const servicer = new Servicer();
    await logger.log(networkManagerNode, "Disabling network manager service");
    await servicer.disableService(
      networkManagerNode,
      "network-manager.service"
    );

    // Disable network worker service
    await Promise.all(
      networkWorkerNodes.map(async node => {
        await logger.log(node, "Disabling network worker service");
        return servicer.disableService(node, "network-worker.service");
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

    // Create network kernel config
    const kernelr = new Kernelr();
    await logger.log(localhost, "Creating network kernel config");
    const networkKernelConfig = await kernelr.createConfig(
      ["net.ipv4.ip_forward = 1", "net.ipv4.conf.all.proxy_arp = 1"],
      "/tmp/sysctl.conf"
    );

    // Upload network kernel config
    await Promise.all(
      allNodes.map(async node => {
        await logger.log(node, "Uploading network kernel config");
        return uploader.upload(networkKernelConfig, `${node}:/etc/sysctl.conf`);
      })
    );

    // Apply network kernel config
    await Promise.all(
      allNodes.map(async node => {
        await logger.log(node, "Applying network kernel config");
        return kernelr.applyConfig(`${node}:/etc/sysctl.conf`);
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
      environment: "WG_I_PREFER_BUGGY_USERSPACE_TO_POLISHED_KMOD=1",
      destination: "/tmp/network-manager.service"
    });

    // Create network worker service
    await logger.log(localhost, "Creating network worker service");
    const networkWorkerServiceSource = await servicer.createService({
      description: "Overlay network daemon (worker only)",
      execStart: `/usr/local/bin/wesher --cluster-key ${networkToken} --join ${
        networkManagerNode.split("@")[1]
      }`,
      environment: "WG_I_PREFER_BUGGY_USERSPACE_TO_POLISHED_KMOD=1",
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

    // Disable firewall service
    await Promise.all(
      allNodes.map(async node => {
        await logger.log(node, "Disabling firewall service");
        return servicer.disableService(node, "firewalld.service");
      })
    );

    // Reload services
    await Promise.all(
      allNodes.map(async node => {
        await logger.log(node, "Reloading services");
        return servicer.reloadServices(node);
      })
    );

    // Enable network manager service
    await logger.log(networkManagerNode, "Enabling network manager service");
    await servicer.enableService(networkManagerNode, "network-manager.service");

    // Enable network worker service
    await Promise.all(
      networkWorkerNodes.map(async node => {
        await logger.log(node, "Enabling network worker service");
        return servicer.enableService(node, "network-worker.service");
      })
    );
    await logger.divide();

    // Get network manager node in network
    const iper = new IPer();
    await logger.log(
      networkManagerNode,
      "Getting network manager node in network"
    );
    await servicer.waitForService(
      networkManagerNode,
      "network-manager.service",
      1000
    );
    await iper.waitForInterface(networkManagerNode, "wgoverlay", 1000);
    const networkManagerNodeInNetworkInterface = await iper.getInterface(
      networkManagerNode,
      "wgoverlay"
    );
    const networkManagerNodeInNetwork = `${networkManagerNode.split("@")[0]}@${
      networkManagerNodeInNetworkInterface.ip
    }`;

    // Get network worker nodes in network
    const networkWorkerNodesInNetwork = [];
    await Promise.all(
      networkWorkerNodes.map(async node => {
        await logger.log(node, "Getting network worker node in network");
        await servicer.waitForService(node, "network-worker.service", 1000);
        await iper.waitForInterface(node, "wgoverlay", 1000);
        const networkWorkerNodeInNetworkInterface = await iper.getInterface(
          node,
          "wgoverlay"
        );
        const networkWorkerNodeInNetwork = `${node.split("@")[0]}@${
          networkWorkerNodeInNetworkInterface.ip
        }`;
        networkWorkerNodesInNetwork.push(networkWorkerNodeInNetwork);
        return true;
      })
    );

    // Create data model of network
    await logger.log(localhost, "Creating network node data model");
    const allNodesInNetwork = [
      networkManagerNodeInNetwork,
      ...networkWorkerNodesInNetwork
    ];
    console.log(
      networkManagerNodeInNetwork,
      networkWorkerNodesInNetwork,
      allNodesInNetwork
    );
    await logger.divide();
  }
});
