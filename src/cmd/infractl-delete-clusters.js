#!/usr/bin/env node

const Clusters = require("../lib/models/clusters");
const Networks = require("../lib/models/networks");
const Nodes = require("../lib/models/nodes");

require("../lib/asHetznerCloudAction")({
  args: "<user@ip> [otherTargets...]",
  action: async (commander, cloud) => {
    const clusters = new Clusters();
    await clusters.deleteStorage();
    await clusters.deleteRouter();
    await Promise.all(
      commander.args.map(node =>
        Promise.all([
          clusters.deleteWorker(node),
          clusters.deleteHybrid(node),
          clusters.deleteManager(node)
        ])
      )
    );
    await Promise.all(commander.args.map(node => clusters.deleteBinary(node)));
    await Promise.all(
      commander.args.map(node =>
        Promise.all([clusters.deleteConfig(node), clusters.deleteData(node)])
      )
    );
    const networks = new Networks();
    await Promise.all(
      commander.args.map(node =>
        Promise.all([networks.deleteWorker(node), networks.deleteManager(node)])
      )
    );
    await Promise.all(commander.args.map(node => networks.deleteBinary(node)));
    await Promise.all(commander.args.map(node => networks.deleteData(node)));
    const nodes = new Nodes(cloud);
    await Promise.all(
      commander.args.map(async providedNode => {
        const gotNodes = await nodes.get();
        const thisNode = gotNodes.data.servers.find(
          node => node.public_net.ipv4.ip === providedNode.split("@")[1]
        );
        if (thisNode) {
          return nodes.delete(thisNode.id);
        } else {
          return true;
        }
      })
    );
    console.log(`Cluster successfully deleted.`);
  }
});
