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
      `${shell.tempdir()}/k3s-hybrid.service`,
      `[Unit]
Description=k3s kubernetes daemon (manager and worker)
After=network.target

[Service]
ExecStart=/usr/local/bin/k3s server --no-flannel --no-deploy traefik --no-deploy servicelb

[Install]
WantedBy=multi-user.target
`,
      () =>
        commander.args.map(target =>
          withRsync({
            source: `${shell.tempdir()}/k3s-hybrid.service`,
            destination: `${target}:/etc/systemd/system/k3s-hybrid.service`,
            permissions: "+rwx",
            reUpload: commander.reUpload === "true"
          }).then(() =>
            withSSH(target, ssh =>
              ssh
                .execCommand(
                  `systemctl daemon-reload;
systemctl enable k3s-hybrid.service --now;`
                )
                .then(() =>
                  withPatches(ssh, ssh => {
                    ssh.dispose();
                    console.log(
                      `Cluster hybrid successfully applied on ${target}.`
                    );
                  })
                )
            )
          )
        )
    )
});
