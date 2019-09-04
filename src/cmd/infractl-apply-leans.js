#!/usr/bin/env node

const Downloader = require("../lib/lean/downloader");
const Uploader = require("../lib/lean/uploader");
const Permissioner = require("../lib/lean/permissioner");
const Servicer = require("../lib/lean/servicer");
const Cryptographer = require("../lib/lean/cryptographer");

require("../lib/asGenericAction")({
  args: "<user@ip> [otherTargets...]",
  action: async commander => {
    // Get nodes
    const networkManagerNode = commander.args[0];
    const networkWorkerNodes = commander.args.filter((_, index) => index !== 0);
    const allNodes = [networkManagerNode, ...networkWorkerNodes];
    // Download network binaries
    const downloader = new Downloader();
    console.log("[INFO] Downloading network core binary");
    const networkDriverBinarySource = await downloader.download(
      "https://nx904.your-next.cloud/s/9JSS9BsQEQTEW8E/download",
      "/tmp/wireguard-go"
    );
    console.log("[INFO] Downloading network interface binary");
    const networkInterfaceBinarySource = await downloader.download(
      "https://nx904.your-next.cloud/s/NLk8NdCPf4GqkZ9/download",
      "/tmp/wesher"
    );
    // Upload network binaries
    const uploader = new Uploader();
    console.log("[INFO] Uploading network core binary");
    await Promise.all(
      allNodes.map(node =>
        uploader.upload(
          networkDriverBinarySource,
          `${node}:/usr/local/bin/wireguard-go`
        )
      )
    );
    console.log("[INFO] Uploading network interface binary");
    await Promise.all(
      allNodes.map(node =>
        uploader.upload(
          networkInterfaceBinarySource,
          `${node}:/usr/local/bin/wesher`
        )
      )
    );
    // Set network binaries' permissions
    const permissioner = new Permissioner();
    console.log("[INFO] Setting permissions for network core binary");
    await Promise.all(
      allNodes.map(node =>
        permissioner.setPermissions(`${node}:/usr/local/bin/wireguard-go`, "+x")
      )
    );
    console.log("[INFO] Setting permissions for network interface binary");
    await Promise.all(
      allNodes.map(node =>
        permissioner.setPermissions(`${node}:/usr/local/bin/wesher`, "+x")
      )
    );
    // Create manager and worker services
    const cryptographer = new Cryptographer();
    console.log("[INFO] Creating network key");
    const networkKey = await cryptographer.getRandomString(32);
    console.log("[INFO] Creating network manager service");
    const servicer = new Servicer();
    const networkManagerServiceSource = await servicer.createService({
      description: "Overlay network daemon (manager and worker)",
      execStart: `/usr/local/bin/wesher --cluster-key ${networkKey}`,
      destination: "/tmp/network-manager.service"
    });
    console.log("[INFO] Creating network worker service");
    const networkWorkerServiceSource = await servicer.createService({
      description: "Overlay network daemon (manager and worker)",
      execStart: `/usr/local/bin/wesher --cluster-key ${networkKey} --join ${
        networkManagerNode.split("@")[1]
      }`,
      destination: "/tmp/network-worker.service"
    });
  }
});
