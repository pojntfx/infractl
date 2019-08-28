#!/usr/bin/env node

const withSSH = require("../lib/withSSH");

require("../lib/asGenericAction")({
  args: "<user@ip>",
  checker: commander => commander.args[0],
  action: commander =>
    withSSH(commander.args[0], ssh =>
      ssh.execCommand(`cat /var/lib/wesher/state.json`).then(result => {
        ssh.dispose();
        console.log(JSON.parse(result.stdout).ClusterKey);
      })
    )
});
