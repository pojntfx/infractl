const writeService = require("../writeService");
const uploadAndStartService = require("../uploadAndStartService");

const writeClusterhybrid = async ({ additionalIp }) =>
  writeService({
    name: "k3s-hybrid.service",
    content: `[Unit]
Description=k3s kubernetes daemon (manager and worker)
After=network.target

[Service]
ExecStart=/usr/local/bin/k3s server${additionalIp &&
      " --tls-san " +
        additionalIp} --no-flannel --no-deploy traefik --no-deploy servicelb

[Install]
WantedBy=multi-user.target
`
  });

const uploadClusterhybrid = async args =>
  uploadAndStartService({
    name: "k3s-hybrid.service",
    ...args
  });

module.exports = { writeClusterhybrid, uploadClusterhybrid };
