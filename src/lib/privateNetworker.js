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
};
