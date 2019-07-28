#!/usr/bin/env node

const withSSH = require("../lib/withSSH");
const withTable = require("../lib/withTable");

require("../lib/asGenericAction")({
  args: "<user@ip>",
  options: [
    [
      "-k, --ssh-key-file [file]",
      "Path to private SSH key for authentication (default ~/.ssh/id_rsa)"
    ]
  ],
  checker: commander => commander.args[0],
  action: commander =>
    withSSH(
      {
        address: commander.args[0],
        privateKey: commander.sshKeyFile
      },
      ssh =>
        ssh.execCommand(`zerotier-one -q info`).then(result => {
          ssh.dispose();
          withTable({
            headers: ["ID", "ONLINE"],
            data: [
              [
                result.stdout.split(" ")[2],
                result.stdout.split(" ")[4] === "ONLINE"
              ]
            ]
          }).then(table => console.log(table));
        })
    )
});
