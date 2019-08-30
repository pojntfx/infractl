const withSSH = require("../withSSH");

module.exports = async ({ target, node }) =>
  new Promise(resolve =>
    withSSH(node, ssh =>
      ssh.execCommand(`cat /var/lib/wesher/state.json`).then(async result => {
        if (result.stdout) {
          const nodes = JSON.parse(result.stdout).Nodes;
          if (target) {
            ssh.dispose();
            resolve({
              list: false,
              data: JSON.stringify(
                nodes.find(node => node.PubKey === target),
                null,
                4
              )
            });
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
            ssh.dispose();
            resolve({ list: true, data: nodesWithOnlineStatus });
          }
        }
      })
    )
  );
