#!/usr/bin/env node

const withSSH = require("../lib/withSSH");

require("../lib/asGenericAction")({
  args: "<user@ip> [otherTargets...]",
  action: commander =>
    commander.args.map(target =>
      withSSH(target, ssh =>
        ssh
          .execCommand(
            "rm -rf /etc/rancher; ip link del kube-bridge; ip link del dummy0; ip link del kube-dummy-if"
          )
          .then(() => {
            ssh.dispose();
            console.log(`Cluster config successfully deleted on ${target}.`);
          })
      )
    )
});
