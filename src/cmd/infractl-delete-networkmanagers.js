#!/usr/bin/env node

const withSSH = require("../lib/withSSH");

require("../lib/asGenericAction")({
  args: "<user@ip> [otherTargets...]",
  action: commander =>
    commander.args.map(target =>
      withSSH(target, ssh =>
        ssh
          .execCommand(
            "systemctl disable wesher-manager.service --now; rm -f /etc/systemd/system/wesher-manager.service; systemctl daemon-reload"
          )
          .then(() => {
            ssh.dispose();
            console.log(`Network manager successfully deleted on ${target}.`);
          })
      )
    )
});
