#!/usr/bin/env node

const shell = require("shelljs");
const fs = require("fs");
const withSSH = require("../lib/withSSH");
const withRsync = require("../lib/withRsync");
const withPatches = require("../lib/withPatches");

require("../lib/asGenericAction")({
  args: "<user@ip> [otherTargets...]",
  action: commander =>
    fs.writeFile(
      `${shell.tempdir()}/k3s-manager.service`,
      `[Unit]
Description=k3s kubernetes daemon (manager only)
After=network.target

[Service]
ExecStart=/usr/local/bin/k3s server --disable-agent --no-flannel

[Install]
WantedBy=multi-user.target      
`,
      () =>
        commander.args.map(target =>
          withRsync({
            source: `${shell.tempdir()}/k3s-manager.service`,
            destination: `${target}:/etc/systemd/system/k3s-manager.service`,
            permissions: "+rwx",
            reUpload: commander.reUpload === "true"
          }).then(() =>
            withSSH(target, ssh =>
              ssh
                .execCommand(
                  "systemctl daemon-reload && systemctl enable k3s-manager.service --now"
                )
                .then(() =>
                  withPatches(ssh, () =>
                    console.log(
                      `Cluster manager successfully applied on ${target}.`
                    )
                  )
                )
            )
          )
        )
    )
});
