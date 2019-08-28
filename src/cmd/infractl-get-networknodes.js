#!/usr/bin/env node

const withSSH = require("../lib/withSSH");
const withTable = require("../lib/withTable");

require("../lib/asGenericAction")({
  args: "<user@ip>",
  checker: commander => commander.args[0],
  action: commander =>
    withSSH(commander.args[0], ssh =>
      ssh.execCommand(`cat /var/lib/wesher/state.json`).then(async result => {
        if (result.stdout) {
          const nodes = JSON.parse(result.stdout).Nodes;
          const nodesWithOnlineStatus = [];
          for (node of nodes) {
            await ssh
              .execCommand(`ping -c 1 ${node.OverlayAddr.IP}`)
              .then(
                res =>
                  (res.stdout.includes("1 received") &&
                    nodesWithOnlineStatus.push([
                      node.PubKey,
                      node.Name,
                      true,
                      node.OverlayAddr.IP
                    ])) ||
                  nodesWithOnlineStatus.push([
                    node.PubKey,
                    node.Name,
                    false,
                    node.OverlayAddr.IP
                  ])
              );
          }
          withTable({
            headers: ["ID", "NAME", "READY", "IP"],
            data: nodesWithOnlineStatus
          }).then(table => {
            ssh.dispose();
            console.log(table);
          });
        }
      })
    )
});
