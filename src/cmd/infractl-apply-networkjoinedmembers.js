#!/usr/bin/env node

const withSSH = require("../lib/withSSH");

require("../lib/asGenericAction")({
  args: "<user@ip> [otherTargets...]",
  options: [
    [
      "-k, --ssh-key-file [file]",
      "Path to private SSH key for authentication (default ~/.ssh/id_rsa)"
    ],
    ["-e, --network-id <id>", "Network's id (i.e. d3ecf5726df0ac91)"]
  ],
  checker: commander => commander.networkId,
  action: commander =>
    commander.args.map(target =>
      withSSH(
        {
          address: target,
          privateKey: commander.sshKeyFile
        },
        ssh =>
          ssh
            .execCommand(`zerotier-one -q join ${commander.networkId}`)
            .then(() => {
              ssh.dispose();
              console.log(
                `Network joined member successfully applied on ${target}.`
              );
            })
      )
    )
});
