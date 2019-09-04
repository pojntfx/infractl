#!/usr/bin/env node

const Downloader = require("../lib/lean/downloader");
const Uploader = require("../lib/lean/uploader");
const Permissioner = require("../lib/lean/permissioner");

require("../lib/asGenericAction")({
  args: "<user@ip> [otherTargets...]",
  action: async commander => {
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
    await uploader.upload(
      wireguardGoSource,
      `${commander.args[0]}:/usr/local/bin/wireguard-go`
    );
    console.log("[INFO] Uploading wesher");
    await uploader.upload(
      wesherSource,
      `${commander.args[0]}:/usr/local/bin/wesher`
    );
    // Set network binaries' permissions
    const permissioner = new Permissioner();
    console.log("[INFO] Set permissions for wireguard-go");
    await permissioner.setPermissions(
      `${commander.args[0]}:/usr/local/bin/wireguard-go`,
      "+x"
    );
    console.log("[INFO] Set permissions for wesher");
    await permissioner.setPermissions(
      `${commander.args[0]}:/usr/local/bin/wesher`,
      "+x"
    );
  }
});
