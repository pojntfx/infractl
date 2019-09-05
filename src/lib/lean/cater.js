const SSHer = require("./ssher");
const fs = require("fs");

module.exports = class {
  async getFileContent(destination, asJSON) {
    const ssher = new SSHer(destination.split(":")[0]);
    let fileContent = "";
    if (ssher.isLocal) {
      fileContent = await new Promise(resolve =>
        fs.readFile(
          destination.split("@")[1].split(":")[1],
          "UTF8",
          (_, data) => resolve(data)
        )
      );
    } else {
      const fileContentRaw = await ssher.execCommand(
        `cat ${destination.split("@")[1].split(":")[1]}`
      );
      fileContent = fileContentRaw;
    }
    return asJSON ? JSON.parse(fileContent) : fileContent;
  }
};
