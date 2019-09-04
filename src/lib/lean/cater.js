const SSHer = require("./ssher");

module.exports = class {
  async getFileContent(destination, asJSON) {
    const ssher = new SSHer(destination.split(":")[0]);
    const fileContent = "";
    if (ssher.isLocal) {
      fileContent = ssher.shell.cat(destination.split(":")[1]);
    } else {
      const fileContentRaw = await ssher.execCommand(
        `cat ${destination.split("@")[1].split(":")[1]}`
      );
      fileContent = fileContentRaw.stdout;
    }
    return asJSON ? JSON.parse(fileContent) : fileContent;
  }
};
