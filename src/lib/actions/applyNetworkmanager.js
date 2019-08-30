const crypto = require("crypto");
const writeService = require("../writeService");
const uploadAndStartService = require("../uploadAndStartService");

const writeNetworkmanager = async () =>
  writeService({
    name: "wesher-manager.service",
    content: `[Unit]
    Description=wesher overlay network daemon (manager and worker)
    After=network.target
    
    [Service]
    ExecStart=/usr/local/bin/wesher --cluster-key ${crypto
      .randomBytes(32)
      .toString("base64")}
    
    [Install]
    WantedBy=multi-user.target
    `
  });

const uploadNetworkmanager = async args =>
  uploadAndStartService({
    name: "wesher-manager.service",
    ...args
  });

module.exports = { writeNetworkmanager, uploadNetworkmanager };
