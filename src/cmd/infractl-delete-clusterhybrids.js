#!/usr/bin/env node

const withSSH = require("../lib/withSSH");

require("../lib/asGenericAction")({
  args: "<user@ip> [otherTargets...]",
  action: commander =>
    commander.args.map(target =>
      withSSH(target, ssh =>
        ssh
          .execCommand(
            "systemctl disable k3s-hybrid.service --now; rm -f /etc/systemd/system/k3s-hybrid.service; systemctl daemon-reload"
          )
          .then(() => {
            ssh.dispose();
            console.log(`Cluster hybrid successfully deleted on ${target}.`);
          })
      )
    )
});
