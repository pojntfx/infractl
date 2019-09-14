const os = require("os");
const SSHer = require("./ssher");

module.exports = class {
  async getHostname(destination) {
    const ssher = new SSHer(destination);
    if (ssher.isLocal) {
      return os.hostname();
    } else {
      return await ssher.execCommand("hostname");
    }
  }

  async getUsername(destination) {
    const ssher = new SSHer(destination);
    if (ssher.isLocal) {
      return os.userInfo().username;
    } else {
      return await ssher.execCommand("whoami");
    }
  }

  async getAddress(destination) {
    return `${await this.getUsername(destination)}@${await this.getHostname(
      destination
    )}`;
  }
};
