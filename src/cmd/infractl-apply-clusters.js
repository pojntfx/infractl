#!/usr/bin/env node

const Nodes = require("../lib/models/nodes");
const crypto = require("crypto");
const shell = require("shelljs");
const Networks = require("../lib/models/networks");
const Clusters = require("../lib/models/clusters");
const fs = require("fs");
const withTable = require("../lib/withTable");

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
        for (let _ of newNodes) {
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
        pingableNodes.push(`${node.split("@")[0]}@${readyNode}`)
      );
    }
    // Wait until all nodes are ssh-able and check the fingerprints
    const sshableInternetNodes = [];
    const sshNode = (user, ip) =>
      new Promise(resolve =>
        shell
          .exec(
            `ssh-keyscan -t rsa ${ip} >> ${process.env.HOME}/.ssh/known_hosts && ssh ${user}@${ip} 'echo $USER'`
          )
          .includes(user)
          ? resolve(ip)
          : setTimeout(() => sshNode(user, ip).then(() => resolve(ip), 1000))
      );
    for (let node of pingableNodes) {
      await sshNode(node.split("@")[0], node.split("@")[1]).then(ip =>
        sshableInternetNodes.push(`${node.split("@")[0]}@${ip}`)
      );
    }
    // Apply the network binaries
    const networks = new Networks();
    const networkBinarySource = await networks.downloadBinary({});
    for (let ip of [...sshableInternetNodes, `${process.env.USER}@localhost`]) {
      // Stop the running binary to allow for overwrite
      await networks.deleteManager(ip);
      await networks.deleteWorker(ip);
      await networks.uploadBinary({ source: networkBinarySource, target: ip });
    }
    const networkManagerIp =
      commander.networkManager || sshableInternetNodes[0];
    // Apply the network manager
    if (!commander.networkToken) {
      const networkManagerSource = await networks.writeManager();
      await networks.uploadManager({
        source: networkManagerSource,
        target: networkManagerIp
      });
    }
    const networkToken =
      commander.networkToken || (await networks.getToken(networkManagerIp));
    // Apply the network workers
    const networkWorkerSource = await networks.writeWorker({
      manager: networkManagerIp.split("@")[1],
      networkToken
    });
    const networkWorkerTargets = commander.networkManager
      ? [
          ...sshableInternetNodes.filter(
            node => node !== commander.networkManager
          ),
          `${process.env.USER}@localhost`
        ]
      : [
          ...sshableInternetNodes.filter((_, index) => index !== 0),
          `${process.env.USER}@localhost`
        ];
    for (let ip of networkWorkerTargets) {
      await networks.uploadWorker({
        source: networkWorkerSource,
        target: ip
      });
    }
    // Wait until all nodes are ssh-able and check the fingerprints
    const networkNodes = [];
    let networkManagerNetworkNode = "";
    for (node of sshableInternetNodes) {
      const localNetworkNodeIp = (await networks.getNode({
        node
      })).data[0][3];
      if (node === networkManagerIp) {
        networkManagerNetworkNode = `${
          node.split("@")[0]
        }@${localNetworkNodeIp}`;
      }
      networkNodes.push(`${node.split("@")[0]}@${localNetworkNodeIp}`);
    }
    const sshableNetworkNodes = [];
    for (let node of networkNodes) {
      await sshNode(node.split("@")[0], node.split("@")[1]).then(ip =>
        sshableNetworkNodes.push(`${node.split("@")[0]}@${ip}`)
      );
    }
    // Apply the cluster binaries
    const clusters = new Clusters();
    const clusterBinarySource = await clusters.downloadBinary({});
    for (let node of sshableNetworkNodes) {
      // Stop the running binary to allow for overwrite
      await clusters.deleteManager(node);
      await clusters.deleteHybrid(node);
      await clusters.deleteWorker(node);
      await clusters.uploadBinary({
        source: clusterBinarySource,
        target: node
      });
    }
    // Apply the cluster manager
    if (!commander.clusterToken) {
      const source = await clusters.writeManager(
        networkManagerNetworkNode.split("@")[1]
      );
      await clusters.uploadManager({
        source,
        target: networkManagerNetworkNode
      });
    }
    // Get the cluster token
    const clusterToken = await clusters.getToken(networkManagerNetworkNode);
    // Apply the cluster workers
    const clusterWorkerTargets = networkManagerNetworkNode
      ? sshableNetworkNodes.filter(node => node !== networkManagerNetworkNode)
      : sshableNetworkNodes.filter((_, index) => index !== 0);
    const clusterWorkerSource = await clusters.writeWorker({
      clusterToken,
      manager: networkManagerNetworkNode.split("@")[1]
    });
    for (node of clusterWorkerTargets) {
      await clusters.uploadWorker({
        source: clusterWorkerSource,
        target: node
      });
    }
    // Get the cluster config
    const clusterConfig = await clusters.getConfig(networkManagerNetworkNode);
    shell.mkdir("-p", `${process.env.HOME}/.kube`);
    fs.writeFileSync(`${process.env.HOME}/.kube/config`, clusterConfig);
    // Apply the cluster router
    await clusters.applyRouter();
    // Apply the cluster storage
    await clusters.applyStorage();
    // Get the cluster nodes
    const clusterNodes = await clusters.getNodes({});
    withTable({
      headers: ["NAME", "READY"],
      data: clusterNodes.data.map(node => [
        node.metadata.name,
        JSON.stringify(
          !(
            node.status.conditions.find(condition => condition.type === "Ready")
              .status === "False"
          )
        )
      ])
    }).then(table => console.log(table));
  }
});
