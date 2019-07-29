#!/usr/bin/env node

const withSSH = require("../lib/withSSH");

require("../lib/asGenericAction")({
  args: "<user@ip>",
  checker: commander => commander.args[0],
  action: commander =>
    withSSH(commander.args[0], ssh =>
      ssh.execCommand(`cat /etc/rancher/k3s/k3s.yaml`).then(result => {
        ssh.dispose();
        console.log(
          result.stdout.replace("localhost", commander.args[0].split("@")[1])
        );
      })
    )
});
