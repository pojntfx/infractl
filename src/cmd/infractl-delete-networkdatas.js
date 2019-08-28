#!/usr/bin/env node

const withSSH = require("../lib/withSSH");

require("../lib/asGenericAction")({
  args: "<user@ip> [otherTargets...]",
  action: commander =>
    commander.args.map(target =>
      withSSH(target, ssh =>
        ssh.execCommand("rm -rf /var/lib/wesher").then(() => {
          ssh.dispose();
          console.log(`Network data successfully deleted on ${target}.`);
        })
      )
    )
});
