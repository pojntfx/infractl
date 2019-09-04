const SSH = require("node-ssh");

module.exports = class {
  async getAllInterfaces(destination) {
    const ssh = new SSH();
    await ssh.connect({
      host: destination.split("@")[1].split(":")[0],
      username: destination.split("@")[0],
      agent: process.env.SSH_AUTH_SOCK
    });
    const rawInterfaces = await ssh.execCommand("ip a");
    const interfaces = rawInterfaces.stdout
      .split("\n")
      .filter(line => line.includes("<"))
      .map(line =>
        line
          .split(":")[1]
          .split(":")[0]
          .replace(" ", "")
      );
    ssh.dispose();
    return interfaces;
  }

  async getInterface(destination, name) {
    const ssh = new SSH();
    await ssh.connect({
      host: destination.split("@")[1].split(":")[0],
      username: destination.split("@")[0],
      agent: process.env.SSH_AUTH_SOCK
    });
    const rawInterface = await ssh.execCommand(`ip addr show ${name}`);
    ssh.dispose();
    return {
      name,
      ip: rawInterface.stdout
        .split("inet")[1]
        .split("/")[0]
        .replace(" ", "")
    };
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
