const fs = require("fs");
const SSH = require("node-ssh");

module.exports = class {
  async createConfig(variables, destination) {
    return new Promise(resolve =>
      fs.writeFile(destination, variables.join("\n") + "\n", () =>
        resolve(destination)
      )
    );
  }

  async applyConfig(destination) {
    const ssh = new SSH();
    await ssh.connect({
      host: destination.split("@")[1].split(":")[0],
      username: destination.split("@")[0],
      agent: process.env.SSH_AUTH_SOCK
    });
    await ssh.execCommand(
      `sudo sysctl -p ${destination.split("@")[1].split(":")[1]}`
    );
    ssh.dispose();
    return true;
  }
};
