#!/usr/bin/env node

const withSSH = require("../lib/withSSH");
const withTable = require("../lib/withTable");

require("../lib/asGenericAction")({
  args: "[id]",
  options: [
    ["-n, --node <user@ip>", "Node from which to get the network members"]
  ],
  checker: commander => commander.node,
  action: commander =>
    withSSH(commander.node, ssh =>
      ssh.execCommand(`cat /var/lib/wesher/state.json`).then(async result => {
        if (result.stdout) {
          const nodes = JSON.parse(result.stdout).Nodes;
          if (commander.args[0]) {
            console.log(
              JSON.stringify(
                nodes.find(node => node.PubKey === commander.args[0]),
                null,
                4
              )
            );
            ssh.dispose();
          } else {
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
            await ssh.execCommand(`ip a`).then(res =>
              ssh.execCommand(`hostname`).then(res2 =>
                nodesWithOnlineStatus.unshift([
                  "NOT AVAILABLE (YOU ARE QUERYING VIA THIS NODE)",
                  res2.stdout,
                  true,
                  res.stdout
                    .split("wgoverlay")[1]
                    .split("inet")[1]
                    .split("/32")[0]
                    .replace(" ", "")
                ])
              )
            );
            withTable({
              headers: ["ID", "NAME", "READY", "IP"],
              data: nodesWithOnlineStatus
            }).then(table => {
              ssh.dispose();
              console.log(table);
            });
          }
        }
      })
    )
});
