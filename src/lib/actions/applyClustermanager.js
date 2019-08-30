const writeService = require("../writeService");
const uploadAndStartService = require("../uploadAndStartService");

const writeClustermanager = async ({ additionalIp }) =>
  writeService({
    name: "k3s-manager.service",
    content: `[Unit]
Description=k3s kubernetes daemon (manager only)
After=network.target

[Service]
ExecStart=/usr/local/bin/k3s server${additionalIp &&
      " --tls-san " +
        additionalIp} --disable-agent --no-flannel --no-deploy traefik --no-deploy servicelb

[Install]
WantedBy=multi-user.target
`
  });

const uploadClustermanager = async args =>
  uploadAndStartService({
    name: "k3s-manager.service",
    ...args
  });

module.exports = { writeClustermanager, uploadClustermanager };
