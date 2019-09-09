const SSHer = require("./ssher");
const os = require("os");

module.exports = class {
  async getAllInterfaces(destination) {
    const ssher = new SSHer(destination);
    if (ssher.isLocal) {
      return Object.keys(os.networkInterfaces());
    } else {
      const rawInterfaces = await ssher.execCommand("ip a");
      const interfaces = rawInterfaces
        .split("\n")
        .filter(line => line.includes("<"))
        .map(line =>
          line
            .split(":")[1]
            .split(":")[0]
            .replace(" ", "")
        );
      return interfaces;
    }
  }

  async getInterface(destination, name) {
    const ssher = new SSHer(destination);
    if (ssher.isLocal) {
      const localNetworkInterfaces = os.networkInterfaces();
      if (localNetworkInterfaces[name]) {
        const localNetworkInterface = localNetworkInterfaces[name].find(
          subInterface => subInterface.family === "IPv4"
        );
        const ip =
          (localNetworkInterface && localNetworkInterface.address) || undefined;
        return {
          name,
          ip
        };
      } else {
        return {
          name,
          ip: undefined
        };
      }
    } else {
      const rawInterface = await ssher.execCommand(`ip addr show ${name}`);
      return {
        name,
        ip:
          rawInterface.split("inet")[1] &&
          rawInterface
            .split("inet")[1]
            .split("/")[0]
            .replace(" ", "")
      };
    }
  }

  async waitForInterface(destination, name, interval) {
    const interfaceToWaitFor = await this.getInterface(destination, name);
    return new Promise(resolve => {
      if (interfaceToWaitFor.ip) {
        resolve(true);
      } else {
        setTimeout(
          () =>
            this.waitForInterface(destination, name, interval).then(() =>
              resolve(true)
            ),
          interval
        );
      }
    });
  }
};
