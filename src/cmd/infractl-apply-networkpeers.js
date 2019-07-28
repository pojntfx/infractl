#!/usr/bin/env node

const shell = require("shelljs");
const fs = require("fs");
const Rsync = require("rsync");
const SSH = require("node-ssh");
const withSSH = require("../lib/withSSH");

require("../lib/asGenericAction")({
  args: "<user@ip> [otherTargets...]",
  options: [
    [
      "-k, --ssh-key-file [file]",
      "Path to private SSH key for authentication (default ~/.ssh/id_rsa)"
    ]
  ],
  action: commander => {
    fs.writeFile(
      `${shell.tempdir()}/zerotier-one.service`,
      `[Unit]
Description=ZeroTier One overlay network daemon
After=network.target

[Service]
ExecStart=/usr/local/bin/zerotier-one

[Install]
WantedBy=multi-user.target
`,
      () =>
        commander.args.map(target => {
          const rsync = new Rsync()
            .shell("ssh")
            .set(commander.reUpload === "true" ? "ignore-times" : undefined)
            .chmod("+rwx")
            .source(`${shell.tempdir()}/zerotier-one.service`)
            .destination(`${target}:/etc/systemd/system/zerotier-one.service`);
          rsync.execute(() => {
            withSSH(
              { address: target, privateKey: commander.sshKeyFile },
              ssh =>
                ssh
                  .execCommand(
                    "systemctl daemon-reload && systemctl enable zerotier-one.service --now"
                  )
                  .then(() => {
                    ssh.dispose();
                    console.log(
                      `Network peer successfully applied to ${target}.`
                    );
                  })
            );
          });
        })
    );
  }
});
