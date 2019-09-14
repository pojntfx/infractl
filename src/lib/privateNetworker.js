const Cater = require("./cater");

module.exports = class {
  async getClusterToken(destination) {
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
    return rawClusterInfo
      ? id
        ? rawClusterInfo.Nodes.map(node => ({
            id: node.PubKey,
            name: node.Name,
            privateIp: node.OverlayAddr.IP,
            publicIp: node.Addr,
            pubKey: node.PubKey
          })).find(node => node.id === id)
        : rawClusterInfo.Nodes.map(node => ({
            id: node.PubKey,
            name: node.Name,
            privateIp: node.OverlayAddr.IP,
            publicIp: node.Addr
          }))
      : false;
  }
};
