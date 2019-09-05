const SSHer = require("./ssher");

module.exports = class {
  async setPermissions(destination, permissions) {
    const ssher = new SSHer(destination.split(":")[0]);
    if (ssher.isLocal) {
      await ssher.shell.chmod(permissions, destination.split(":")[1]);
    } else {
      await ssher.execCommand(
        `chmod ${permissions} ${destination.split(":")[1]}`
      );
    }
    return true;
  }
};
