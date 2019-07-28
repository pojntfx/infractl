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
          ssh.execCommand(`rm -rf /var/lib/zerotier-one`).then(() => {
            ssh.dispose();
            console.log(`Network config successfully deleted on ${target}.`);
          })
      )
    )
});
