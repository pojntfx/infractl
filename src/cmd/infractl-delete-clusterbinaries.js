#!/usr/bin/env node

const withSSH = require("../lib/withSSH");

require("../lib/asGenericAction")({
  args: "<user@ip> [otherTargets...]",
  action: commander =>
    commander.args.map(target =>
      withSSH(target, ssh =>
        ssh.execCommand("rm -f /usr/local/bin/k3s").then(() => {
          ssh.dispose();
          console.log(`Cluster binary successfully deleted on ${target}.`);
        })
      )
    )
});
