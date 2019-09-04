const SSH = require("node-ssh");

module.exports = class {
  async getFileContent(destination, asJSON) {
    const ssh = new SSH();
    await ssh.connect({
      host: destination.split("@")[1].split(":")[0],
      username: destination.split("@")[0],
      agent: process.env.SSH_AUTH_SOCK
    });
    const fileContent = await ssh.execCommand(
      `cat ${destination.split("@")[1].split(":")[1]}`
    );
    ssh.dispose();
    return asJSON ? JSON.parse(fileContent.stdout) : fileContent.stdout;
  }
};
