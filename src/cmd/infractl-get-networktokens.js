#!/usr/bin/env node

const withSSH = require("../lib/withSSH");

require("../lib/asGenericAction")({
  args: "<user@ip>",
  checker: commander => commander.args[0],
  action: commander =>
    withSSH(commander.args[0], ssh =>
      ssh
        .execCommand(`cat /etc/systemd/system/wesher-manager.service`)
        .then(result => {
          ssh.dispose();
          console.log(
            result.stdout &&
              result.stdout
                .split("--cluster-key")[1]
                .split("\n")[0]
                .replace(" ", "")
          );
        })
    )
});
