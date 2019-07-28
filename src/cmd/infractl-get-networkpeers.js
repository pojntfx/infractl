#!/usr/bin/env node

const withSSH = require("../lib/withSSH");
const withTable = require("../lib/withTable");

require("../lib/asGenericAction")({
  args: "<user@ip>",
  checker: commander => commander.args[0],
  action: commander =>
    withSSH(commander.args[0], ssh =>
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
