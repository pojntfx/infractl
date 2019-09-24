const Cater = require("./cater");
const fs = require("fs");

module.exports = class {
  async createNFSSetup(source, destination, size) {
    const cater = new Cater();
    const originalNFSSetup = await cater.getFileContent(source, false, false);
    const nfsSetupWithNewSize = originalNFSSetup.replace(
      /PERSISTENCE_SIZE/g,
      `${size}G`
    );
    return await new Promise(resolve =>
      fs.writeFile(destination, nfsSetupWithNewSize, () => resolve(destination))
    );
  }
};
