#!/usr/bin/env node

const withSSH = require("../lib/withSSH");

require("../lib/asGenericAction")({
  args: "<user@ip> [otherTargets...]",
  action: commander =>
    commander.args.map(target =>
      withSSH(target, ssh =>
        ssh.execCommand(`rm -rf /etc/rancher`).then(() => {
          ssh.dispose();
          console.log(`Cluster config successfully deleted on ${target}.`);
        })
      )
    )
});
