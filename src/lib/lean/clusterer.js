const Cater = require("./cater");

module.exports = class {
  async getClusterToken(destination) {
    const cater = new Cater();
    return await cater.getFileContent(
      `${destination}:/var/lib/rancher/k3s/server/node-token`
    );
  }

  async waitForClusterToken(destination, interval) {
    const clusterToken = await this.getClusterToken(destination);
    return new Promise(resolve => {
      if (clusterToken) {
        resolve(true);
      } else {
        setTimeout(
          () =>
            this.waitForClusterToken(destination, interval).then(() =>
              resolve(true)
            ),
          interval
        );
      }
    });
  }
};
