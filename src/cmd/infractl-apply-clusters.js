#!/usr/bin/env node

const Nodes = require("../lib/models/nodes");
const crypto = require("crypto");
const shell = require("shelljs");

require("../lib/asHetznerCloudAction")({
  args: "[user@ip|new] [otherTargets...]",
  options: [
    [
      "-n, --network-manager [user@ip]",
      "Network manager (only necessary if you are joining as a worker)"
    ],
    [
      "-N, --network-token [networktoken]",
      "Network token of the network manager (only necessary if you are joining as a worker, if not provided this will be queried from the specified network manager)"
    ],
    [
      "-c, --cluster-manager [user@ip]",
      "Cluster manager (only necessary if you are joining as a worker)"
    ],
    [
      "-C, --cluster-token [networktoken]",
      "Cluster token of the cluster manager (only necessary if you are joining as a worker, if not provided this will be queried from the specified cluster manager)"
    ],
    [
      "-k, --ssh-key [key]",
      "New nodes' SSH key (i.e. pojntfx@thinkpadx1c3.pojtinger.space) (only necessary if you are creating new nodes)"
    ]
  ],
  checker: commander => commander.args[0],
  action: async (commander, cloud) => {
    const newNodes = commander.args.filter(node => node === "new");
    const existingNodes = commander.args.filter(node => node !== "new");
    const createdNewNodes = existingNodes;
    // Create new nodes if the user has specified them with the `new` keyword
    if (newNodes.length >= 1) {
      if (!commander.sshKey) {
        commander.outputHelp();
      } else {
        const nodes = new Nodes(cloud);
        for (let node of newNodes) {
          await nodes
            .apply({
              name: `node-${crypto.randomBytes(8).toString("hex")}`,
              operatingSystem: "debian-10",
              nodeType: "cx21",
              location: "nbg1",
              sshKeys: commander.sshKey,
              poweredOn: true
            })
            .then(createdNode =>
              createdNewNodes.push(`root@${createdNode.ip}`)
            );
        }
      }
    }
    // Wait until all nodes are pingable
    const pingableNodes = [];
    const pingNode = ip =>
      new Promise(resolve =>
        shell.exec(`ping -c 1 ${ip}`).includes("1 received")
          ? resolve(ip)
          : setTimeout(() => pingNode(ip).then(() => resolve(ip), 1000))
      );
    for (let node of createdNewNodes) {
      await pingNode(node.split("@")[1]).then(readyNode =>
        pingableNodes.push(readyNode)
      );
    }
    // Wait until all nodes are ssh-able
    const sshableIps = [];
    const sshNode = (user, ip) =>
      new Promise(resolve =>
        shell.exec(`ssh ${user}@${ip} 'echo $USER'`).includes(user)
          ? resolve(ip)
          : setTimeout(() => sshNode(user, ip).then(() => resolve(ip), 1000))
      );
    for (let ip of pingableNodes) {
      await sshNode("root", ip).then(ip => sshableIps.push(`root@${ip}`));
    }
    // List the sshable ips
    console.log(JSON.stringify(sshableIps));
  }
});
