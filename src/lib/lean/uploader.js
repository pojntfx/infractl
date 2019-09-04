const SSHer = require("./ssher");

module.exports = class {
  async upload(source, destination) {
    const ssher = new SSHer(destination.split(":")[0]);
    await ssher.putFile(source, destination.split(":")[1]);
    return true;
  }
};