#!/usr/bin/env node

const withSSH = require("../lib/withSSH");

require("../lib/asGenericAction")({
  args: "<user@ip> [otherTargets...]",
  action: commander =>
    commander.args.map(target =>
      withSSH(target, ssh =>
        ssh
          .execCommand(
            "systemctl disable zerotier-one.service --now && rm -f /etc/systemd/system/zerotier-one.service && systemctl daemon-reload"
          )
          .then(() => {
            ssh.dispose();
            console.log(`Network peer successfully deleted on ${target}.`);
          })
      )
    )
});
