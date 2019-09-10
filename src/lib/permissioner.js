const SSHer = require("./ssher");

module.exports = class {
  async setPermissions(destination, permissions, withSudo) {
    const ssher = new SSHer(destination.split(":")[0]);
    return await ssher.chmod(destination, permissions, withSudo);
  }
};
