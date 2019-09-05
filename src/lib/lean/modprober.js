const SSHer = require("./ssher");

module.exports = class {
  async modprobe(destination, module) {
    const ssher = new SSHer(destination);
    await ssher.execCommand(`sudo modprobe ${module}`);
    return true;
  }
};
