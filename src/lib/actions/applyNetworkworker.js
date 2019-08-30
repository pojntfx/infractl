const writeService = require("../writeService");
const uploadAndStartService = require("../uploadAndStartService");

const writeNetworkworker = async ({ networkToken, manager }) =>
  writeService({
    name: "wesher-worker.service",
    content: `[Unit]
    Description=wesher overlay network daemon (worker only)
    After=network.target

[Service]
ExecStart=/usr/local/bin/wesher --cluster-key ${networkToken} --join ${manager}

[Install]
WantedBy=multi-user.target
`
  });

const uploadNetworkworker = async args =>
  uploadAndStartService({
    name: "wesher-worker.service",
    ...args
  });

module.exports = { writeNetworkworker, uploadNetworkworker };
