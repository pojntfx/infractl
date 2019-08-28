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
      "-t, --network-token [networktoken]",
      "Worker's network token (i.e. Cpd2K+xm2u8OF/TB3s=)"
    ],
    ["-m, --manager [manager]", "Worker's manager (i.e. 159.69.80.168)"]
  ],
  checker: commander => commander.networkToken && commander.manager,
  action: commander =>
    fs.writeFile(
      `${shell.tempdir()}/wesher-worker.service`,
      `[Unit]
      Description=wesher overlay network daemon (worker only)
      After=network.target

[Service]
ExecStart=bash -c "[ -f /var/lib/wesher/state.json ] && /usr/local/bin/wesher --cluster-key ${commander.networkToken} --join ${commander.manager} || /usr/local/bin/wesher --init --cluster-key ${commander.networkToken} --join ${commander.manager}"

[Install]
WantedBy=multi-user.target
`,
      () =>
        commander.args.map(target =>
          withRsync({
            source: `${shell.tempdir()}/wesher-worker.service`,
            destination: `${target}:/etc/systemd/system/wesher-worker.service`,
            permissions: "+rwx",
            reUpload: commander.reUpload === "true"
          }).then(() =>
            withSSH(target, ssh =>
              ssh
                .execCommand(
                  `systemctl daemon-reload;
systemctl enable wesher-worker.service --now;`
                )
                .then(() =>
                  withPatches(ssh, ssh => {
                    ssh.dispose();
                    console.log(
                      `Network worker successfully applied on ${target}.`
                    );
                  })
                )
            )
          )
        )
    )
});
