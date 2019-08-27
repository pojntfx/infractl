#!/usr/bin/env node

const withSSH = require("../lib/withSSH");

require("../lib/asGenericAction")({
  args: "<user@ip> [otherTargets...]",
  action: commander =>
    commander.args.map(target =>
      withSSH(target, ssh =>
        ssh.execCommand("sudo rm -f /usr/local/bin/wesher").then(() => {
          ssh.dispose();
          console.log(`Network binary successfully deleted on ${target}.`);
        })
      )
    )
});
