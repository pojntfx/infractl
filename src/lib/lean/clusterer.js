const Cater = require("./cater");

module.exports = class {
  async getClusterToken(destination) {
    const cater = new Cater();
    return await cater.getFileContent(
      `${destination}:/var/lib/rancher/k3s/server/node-token`,
      false,
      true
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

  async getClusterConfig(destination, ip) {
    const cater = new Cater();
    const rawClusterConfig = await cater.getFileContent(
      `${destination}:/etc/rancher/k3s/k3s.yaml`,
      false,
      true
    );
    return rawClusterConfig.replace(/127\.0\.0\.1/g, ip);
  }

  async waitForClusterConfig(destination, interval) {
    const clusterConfig = await this.getClusterConfig(destination);
    return new Promise(resolve => {
      if (clusterConfig) {
        resolve(true);
      } else {
        setTimeout(
          () =>
            this.waitForClusterConfig(destination, interval).then(() =>
              resolve(true)
            ),
          interval
        );
      }
    });
  }
};
