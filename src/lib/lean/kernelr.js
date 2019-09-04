const fs = require("fs");
const SSHer = require("./ssher");

module.exports = class {
  async createConfig(variables, destination) {
    return new Promise(resolve =>
      fs.writeFile(destination, variables.join("\n") + "\n", () =>
        resolve(destination)
      )
    );
  }

  async applyConfig(destination) {
    const ssher = new SSHer(destination.split(":")[0]);
    await ssher.execCommand(`sudo sysctl -p ${destination.split(":")[1]}`);
    return true;
  }
};
