const Cater = require("./cater");
const fs = require("fs");

module.exports = class {
  async createKubeVirtSetup(source, destination, useAcceleration) {
    const cater = new Cater();
    const originalKubeVirtSetup = await cater.getFileContent(
      source,
      false,
      false
    );
    const kubeVirtSetupWithNewSize = originalKubeVirtSetup.replace(
      /DEBUG_USE_EMULATION/g,
      `${useAcceleration ? '"false"' : '"true"'}`
    );
    return await new Promise(resolve =>
      fs.writeFile(destination, kubeVirtSetupWithNewSize, () =>
        resolve(destination)
      )
    );
  }
};
