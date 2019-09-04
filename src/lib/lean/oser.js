const Cater = require("./cater");

module.exports = class {
  async getOS(destination) {
    const cater = new Cater();
    const osFile = await cater.getFileContent(`${destination}:/etc/os-release`);
    return osFile
      .split("\n")
      .find(line => line[0] === "I" && line[1] == "D")
      .split("=")[1]
      .replace(/\"/g, "");
  }
};
