const Cater = require("./cater");
const IPer = require("./iper");
const AsyncHostnamer = require("./asyncHostnamer");

module.exports = class {
  async getType2ClusterToken(destination) {
    const cater = new Cater();
    const rawClusterWorkerToken = await cater.getFileContent(
      `${destination}:/etc/systemd/system/private-network-cluster-worker-type-2.service`,
      false,
      true
    );
    if (rawClusterWorkerToken) {
      return rawClusterWorkerToken.split(" -k ")[1].split(" -l")[0];
    } else {
      const rawClusterManagerToken = await cater.getFileContent(
        `${destination}:/etc/systemd/system/private-network-cluster-manager-type-2.service`,
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

  async getType2Nodes(destination, id) {
    const cater = new Cater();
    const iper = new IPer();
    const asyncHostnamer = new AsyncHostnamer();
    const basicQueryNode = {
      id: "not_available_manually_configured",
      name: await asyncHostnamer.getHostname(destination),
      ips: {
        private: (await iper.getInterface(destination, "edge0")).ip
      }
    };
    const rawClusterNodes = await cater.getFileContent(
      `${destination}:/var/lib/dhcp/dhcpd.leases`,
      false,
      true
    );
    const parsedClusterNodes = [
      basicQueryNode,
      ...rawClusterNodes
        .split("\n")
        .filter(line => !line.includes("#")) // Remove comments
        .join("\n")
        .split("lease ")
        .filter(block => block.includes("}"))
        .map(block => ({
          id: block.split("hardware ethernet ")[1].split(";")[0],
          name: block.split("client-hostname ")[1]
            ? block
                .split("client-hostname")[1]
                .split(";")[0]
                .split('"')[1]
                .split('"')[0]
            : "not_available_hostname_unknown",
          ips: {
            private: block.split(" {")[0]
          }
        }))
    ];
    return parsedClusterNodes
      ? id
        ? parsedClusterNodes.find(node => node.id === id)
        : parsedClusterNodes
      : false;
  }

  async getType3Nodes(destination, id) {
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
