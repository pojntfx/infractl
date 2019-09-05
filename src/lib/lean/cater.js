const SSHer = require("./ssher");
const fs = require("fs");

module.exports = class {
  async getFileContent(destination, asJSON) {
    const ssher = new SSHer(destination.split(":")[0]);
    let fileContent = false;
    if (ssher.isLocal) {
      fileContent = await new Promise(resolve => {
        fs.existsSync(destination.split("@")[1].split(":")[1])
          ? fs.readFile(
              destination.split("@")[1].split(":")[1],
              "UTF8",
              (_, data) => resolve(data)
            )
          : resolve(false);
      });
    } else {
      const fileContentRaw = await ssher.execCommand(
        `[ -f ${destination.split("@")[1].split(":")[1]} ] && cat ${
          destination.split("@")[1].split(":")[1]
        }`
      );
      fileContent = fileContentRaw;
    }
    return asJSON ? JSON.parse(fileContent) : fileContent;
  }
};
