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

  async waitForWorkloadClusterToken(destination, interval) {
    const clusterToken = await this.getClusterToken(destination);
    return new Promise(resolve => {
      if (clusterToken) {
        resolve(true);
      } else {
        setTimeout(
          () =>
            this.waitForWorkloadClusterToken(destination, interval).then(() =>
              resolve(true)
            ),
          interval
        );
      }
    });
  }

  async getWorkloadClusterConfig(destination, ip) {
    const cater = new Cater();
    const rawClusterConfig = await cater.getFileContent(
      `${destination}:/etc/rancher/k3s/k3s.yaml`,
      false,
      true
    );
    return rawClusterConfig.replace(/127\.0\.0\.1/g, ip);
  }

  async waitForClusterConfig(destination, interval) {
    const clusterConfig = await this.getWorkloadClusterConfig(destination);
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
