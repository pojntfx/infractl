#!/usr/bin/env node

const withSSH = require("../lib/withSSH");

require("../lib/asGenericAction")({
  args: "<user@ip> [otherTargets...]",
  options: [["-e, --network-id <id>", "Network's id (i.e. d3ecf5726df0ac91)"]],
  checker: commander => commander.networkId,
  action: commander =>
    commander.args.map(target =>
      withSSH(target, ssh =>
        ssh
          .execCommand(`zerotier-one -q leave ${commander.networkId}`)
          .then(() => {
            ssh.dispose();
            console.log(
              `Network joined member successfully deleted on ${target}.`
            );
          })
      )
    )
});
