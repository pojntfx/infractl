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
    console.log("[INFO] Downloading wireguard-go");
    const wireguardGoSource = await downloader.download(
      "https://nx904.your-next.cloud/s/9JSS9BsQEQTEW8E/download",
      "/tmp/wireguard-go"
    );
    console.log("[INFO] Downloading wesher");
    const wesherSource = await downloader.download(
      "https://nx904.your-next.cloud/s/NLk8NdCPf4GqkZ9/download",
      "/tmp/wesher"
    );
    // Upload network binaries
    const uploader = new Uploader();
    console.log("[INFO] Uploading wireguard-go");
    await Promise.all(
      allNodes.map(node =>
        uploader.upload(
          wireguardGoSource,
          `${node}:/usr/local/bin/wireguard-go`
        )
      )
    );
    console.log("[INFO] Uploading wesher");
    await Promise.all(
      allNodes.map(node =>
        uploader.upload(wesherSource, `${node}:/usr/local/bin/wesher`)
      )
    );
    // Set network binaries' permissions
    const permissioner = new Permissioner();
    console.log("[INFO] Set permissions for wireguard-go");
    await Promise.all(
      allNodes.map(node =>
        permissioner.setPermissions(`${node}:/usr/local/bin/wireguard-go`, "+x")
      )
    );
    console.log("[INFO] Set permissions for wesher");
    await Promise.all(
      allNodes.map(node =>
        permissioner.setPermissions(`${node}:/usr/local/bin/wesher`, "+x")
      )
    );
    // Create manager and worker services
    const servicer = new Servicer();
    const cryptographer = new Cryptographer();
  }
});
