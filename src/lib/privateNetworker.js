const Cater = require("./cater");
const IPer = require("./iper");
const AsyncHostnamer = require("./asyncHostnamer");

module.exports = class {
  async getType2ClusterToken(destination) {
    const cater = new Cater();
    const rawClusterWorkerToken = await cater.getFileContent(
      `${destination}:/etc/systemd/system/private-network-cluster-worker.service`,
      false,
      true
    );
    if (rawClusterWorkerToken) {
      return rawClusterWorkerToken.split(" -k ")[1].split(" -l")[0];
    } else {
      const rawClusterManagerToken = await cater.getFileContent(
        `${destination}:/etc/systemd/system/private-network-cluster-manager.service`,
        false,
        true
      );
      if (rawClusterManagerToken) {
        return rawClusterManagerToken.split(" -k ")[1].split(" -l")[0];
      } else {
        return false;
      }
    }
  }

  async getType3ClusterToken(destination) {
    const cater = new Cater();
    const rawClusterInfo = await cater.getFileContent(
      `${destination}:/var/lib/wesher/state.json`,
      true,
      true
    );
    return rawClusterInfo ? rawClusterInfo.ClusterKey : false;
  }

  async getNodes(destination, id) {
    const cater = new Cater();
    const rawClusterInfo = await cater.getFileContent(
      `${destination}:/var/lib/wesher/state.json`,
      true,
      true
    );
    const iper = new IPer();
    const asyncHostnamer = new AsyncHostnamer();
    const basicQueryNode = {
      id: "not_available_this_is_the_query_node",
      name: await asyncHostnamer.getHostname(destination),
      ips: {
        private: (await iper.getInterface(destination, "wgoverlay")).ip,
        public: destination.split("@")[1]
      }
    };
    const queryNode = id
      ? { ...basicQueryNode, pubKey: "not_available_this_is_the_query_node" }
      : basicQueryNode;
    return rawClusterInfo
      ? id
        ? [
            queryNode,
            ...rawClusterInfo.Nodes.map(node => ({
              id: node.PubKey,
              name: node.Name,
              ips: {
                private: node.OverlayAddr.IP,
                public: node.Addr
              },
              pubKey: node.PubKey
            }))
          ].find(node => node.id === id)
        : [
            queryNode,
            ...rawClusterInfo.Nodes.map(node => ({
              id: node.PubKey,
              name: node.Name,
              ips: {
                private: node.OverlayAddr.IP,
                public: node.Addr
              }
            }))
          ]
      : false;
  }
};
