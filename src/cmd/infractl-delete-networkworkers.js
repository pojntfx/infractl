#!/usr/bin/env node

const withSSH = require("../lib/withSSH");

require("../lib/asGenericAction")({
  args: "<user@ip> [otherTargets...]",
  action: commander =>
    commander.args.map(target =>
      withSSH(target, ssh =>
        ssh
          .execCommand(
            "systemctl disable wesher-worker.service --now; rm -f /etc/systemd/system/wesher-worker.service; systemctl daemon-reload"
          )
          .then(() => {
            ssh.dispose();
            console.log(`Network worker successfully deleted on ${target}.`);
          })
      )
    )
});
