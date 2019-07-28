#!/usr/bin/env node

const SSH = require("node-ssh");

require("../lib/asGenericAction")({
  args: "<user@ip> [otherTargets...]",
  options: [
    [
      "-k, --ssh-key-file [file]",
      "Path to private SSH key for authentication (default ~/.ssh/id_rsa)"
    ]
  ],
  action: commander =>
    commander.args.map(target => {
      const ssh = new SSH();
      ssh
        .connect({
          host: target.split("@")[1],
          username: target.split("@")[0],
          privateKey: commander.sshKeyFile || `${process.env.HOME}/.ssh/id_rsa`
        })
        .then(() =>
          ssh.execCommand("rm -f /usr/local/bin/zerotier-one").then(() => {
            console.log(`Network binary successfully deleted from ${target}.`);
            return ssh.dispose();
          })
        );
    })
});
