#!/usr/bin/env node

const withSSH = require("../lib/withSSH");

require("../lib/asGenericAction")({
  args: "<user@ip> [otherTargets...]",
  options: [
    [
      "-k, --ssh-key-file [file]",
      "Path to private SSH key for authentication (default ~/.ssh/id_rsa)"
    ]
  ],
  action: commander =>
    commander.args.map(target =>
      withSSH(
        {
          address: target,
          privateKey: commander.sshKeyFile
        },
        ssh =>
          ssh
            .execCommand(
              "systemctl disable zerotier-one.service --now && rm -f /usr/local/bin/zerotier-one /etc/systemd/system/zerotier-one.service && systemctl daemon-reload"
            )
            .then(() => {
              ssh.dispose();
              console.log(`Network peer successfully deleted on ${target}.`);
            })
      )
    )
});
