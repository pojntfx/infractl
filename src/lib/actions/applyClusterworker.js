const writeService = require("../writeService");
const uploadAndStartService = require("../uploadAndStartService");

const writeClusterworker = async ({ clusterToken, manager }) =>
  writeService({
    name: "k3s-worker.service",
    content: `[Unit]
Description=k3s kubernetes daemon (worker only)
After=network.target

[Service]
ExecStart=/usr/local/bin/k3s agent --no-flannel --token ${clusterToken} --server https://${manager}:6443

[Install]
WantedBy=multi-user.target
`
  });

const uploadClusterworker = async args =>
  uploadAndStartService({
    name: "k3s-worker.service",
    ...args
  });

module.exports = { writeClusterworker, uploadClusterworker };
