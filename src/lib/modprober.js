const SSHer = require("./ssher");

module.exports = class {
  async modprobe(destination, module) {
    const ssher = new SSHer(destination);
    return await ssher.execCommand(`sudo modprobe ${module}`);
  }
};
