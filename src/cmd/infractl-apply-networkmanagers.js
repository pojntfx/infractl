#!/usr/bin/env node

const shell = require("shelljs");
const fs = require("fs");
const withSSH = require("../lib/withSSH");
const withRsync = require("../lib/withRsync");

require("../lib/asGenericAction")({
  args: "<user@ip> [otherTargets...]",
  action: commander =>
    fs.writeFile(
      `${shell.tempdir()}/wesher-manager.service`,
      `[Unit]
Description=wesher overlay network daemon (manager and worker)
After=network.target

[Service]
ExecStart=/usr/local/bin/wesher --init

[Install]
WantedBy=multi-user.target
`,
      () =>
        commander.args.map(target =>
          withRsync({
            source: `${shell.tempdir()}/wesher-manager.service`,
            destination: `${target}:/etc/systemd/system/wesher-manager.service`,
            permissions: "+rwx",
            reUpload: commander.reUpload === "true"
          }).then(() =>
            withSSH(target, ssh =>
              ssh
                .execCommand(
                  `systemctl daemon-reload;
systemctl enable wesher-manager.service --now;`
                )
                .then(() => {
                  ssh.dispose();
                  console.log(
                    `Network manager successfully applied on ${target}.`
                  );
                })
            )
          )
        )
    )
});
