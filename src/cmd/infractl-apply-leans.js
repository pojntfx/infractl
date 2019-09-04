#!/usr/bin/env node

const Downloader = require("../lib/lean/downloader");
const Uploader = require("../lib/lean/uploader");

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
  }
});
