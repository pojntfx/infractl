const SSHer = require("./ssher");

module.exports = class {
  async installDebianPackage(destination) {
    const ssher = new SSHer(destination.split(":")[0]);
    return await ssher.execCommand(`sudo dpkg -i ${destination.split(":")[1]}`);
  }

  async installCentOSPackage(destination) {
    const ssher = new SSHer(destination.split(":")[0]);
    return await ssher.execCommand(`sudo rpm -i ${destination.split(":")[1]}`);
  }
};
