const SSHer = require("./ssher");

module.exports = class {
  async installDebianPackage(destination) {
    const ssher = new SSHer(destination.split(":")[0]);
    await ssher.execCommand(`sudo dpkg -i ${destination.split(":")[1]}`);
    return true;
  }
};
