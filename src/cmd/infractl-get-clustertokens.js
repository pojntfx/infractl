#!/usr/bin/env node

const withSSH = require("../lib/withSSH");

require("../lib/asGenericAction")({
  args: "<user@ip>",
  checker: commander => commander.args[0],
  action: commander =>
    withSSH(commander.args[0], ssh =>
      ssh
        .execCommand(`cat /var/lib/rancher/k3s/server/node-token`)
        .then(result => {
          ssh.dispose();
          console.log(result.stdout);
        })
    )
});
