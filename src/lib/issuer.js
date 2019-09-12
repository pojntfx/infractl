const Cater = require("./cater");
const fs = require("fs");

module.exports = class {
  async createIssuers(source, destination, email) {
    const cater = new Cater();
    const originalIssuers = await cater.getFileContent(source, false, false);
    const issuersWithNewEmail = originalIssuers.replace(/ACME_EMAIL/g, email);
    return await new Promise(resolve =>
      fs.writeFile(destination, issuersWithNewEmail, () => resolve(destination))
    );
  }
};
