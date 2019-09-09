const SSHer = require("./ssher");

module.exports = class {
  async upload(source, destination, withSudo) {
    const ssher = new SSHer(destination.split(":")[0]);
    await ssher.putFile(source, destination.split(":")[1], withSudo);
    return destination;
  }

  async createDirectory(destination, withSudo) {
    const ssher = new SSHer(destination.split(":")[0]);
    await ssher.mkdir(destination, withSudo);
    return destination;
  }
};
