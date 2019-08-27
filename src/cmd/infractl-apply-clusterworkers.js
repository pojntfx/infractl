#!/usr/bin/env node

const shell = require("shelljs");
const fs = require("fs");
const withSSH = require("../lib/withSSH");
const withRsync = require("../lib/withRsync");
const withPatches = require("../lib/withPatches");

require("../lib/asGenericAction")({
  args: "<user@ip> [otherTargets...]",
  options: [
    [
      "-t, --cluster-token [clustertoken]",
      "Worker's cluster token (i.e. bb25f9c6::node:6bf075c)"
    ],
    [
      "-m, --manager [manager]",
      "Worker's manager (i.e. https://195.201.22.140:6443)"
    ]
  ],
  checker: commander => commander.clusterToken && commander.manager,
  action: commander =>
    fs.writeFile(
      `${shell.tempdir()}/k3s-worker.service`,
      `[Unit]
Description=k3s kubernetes daemon (worker only)
After=network.target

[Service]
ExecStart=/usr/local/bin/k3s agent --no-flannel --token ${commander.clusterToken} --server ${commander.manager}

[Install]
WantedBy=multi-user.target
`,
      () =>
        commander.args.map(target =>
          withRsync({
            source: `${shell.tempdir()}/k3s-worker.service`,
            destination: `${target}:/etc/systemd/system/k3s-worker.service`,
            permissions: "+rwx",
            reUpload: commander.reUpload === "true"
          }).then(() =>
            withSSH(target, ssh =>
              ssh
                .execCommand(
                  `systemctl daemon-reload;
systemctl enable k3s-worker.service --now;`
                )
                .then(() =>
                  withPatches(ssh, () => {
                    ssh.dispose();
                    console.log(
                      `Cluster worker successfully applied on ${target}.`
                    );
                  })
                )
            )
          )
        )
    )
});
