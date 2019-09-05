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
      return {
        name,
        ip: os
          .networkInterfaces()
          [name].find(subInterface => subInterface.family === "IPv4")["address"]
      };
    } else {
      const rawInterface = await ssher.execCommand(`ip addr show ${name}`);
      return {
        name,
        ip: rawInterface
          .split("inet")[1]
          .split("/")[0]
          .replace(" ", "")
      };
    }
  }

  async waitForInterface(destination, name, interval) {
    const allInterfaces = await this.getAllInterfaces(destination);
    return new Promise(resolve => {
      if (allInterfaces.includes(name)) {
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
