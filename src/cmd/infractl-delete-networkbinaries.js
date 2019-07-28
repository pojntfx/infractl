#!/usr/bin/env node

const withSSH = require("../lib/withSSH");

require("../lib/asGenericAction")({
  args: "<user@ip> [otherTargets...]",
  action: commander =>
    commander.args.map(target =>
      withSSH(target, ssh =>
        ssh.execCommand("rm -f /usr/local/bin/zerotier-one").then(() => {
          ssh.dispose();
          console.log(`Network binary successfully deleted on ${target}.`);
        })
      )
    )
});
