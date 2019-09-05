const SSHer = require("./ssher");

module.exports = class {
  async setPermissions(destination, permissions) {
    const ssher = new SSHer(destination.split(":")[0]);
    await ssher.chmod(destination, permissions);
    return true;
  }
};
