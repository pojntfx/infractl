const fs = require("fs");

module.exports = class {
  async createConfig({ subnet, netmask }, range, destination) {
    return new Promise(resolve =>
      fs.writeFile(
        destination,
        `subnet ${subnet} netmask ${netmask} {
        range ${range.join(" ")};
}\n`,
        () => resolve(destination)
      )
    );
  }
};
