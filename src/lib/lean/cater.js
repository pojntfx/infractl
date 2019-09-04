const SSHer = require("./ssher");

module.exports = class {
  async getFileContent(destination, asJSON) {
    const ssher = new SSHer(destination.split(":")[0]);
    let fileContent = "";
    if (ssher.isLocal) {
      await new Promise(resolve => {
        fileContent = fs.readFile(destination.split("@")[1].split(":")[1], () =>
          resolve(true)
        );
      });
    } else {
      const fileContentRaw = await ssher.execCommand(
        `cat ${destination.split("@")[1].split(":")[1]}`
      );
      fileContent = fileContentRaw;
    }
    return asJSON ? JSON.parse(fileContent) : fileContent;
  }
};
