const SSHer = require("./ssher");

module.exports = class {
  async setenforce(destination, mode) {
    const ssher = new SSHer(destination);
    return await ssher.execCommand(
      `command -v setenforce && sudo sentenforce ${mode}`
    );
  }

  async semanage(destination) {
    const ssher = new SSHer(destination.split(":")[0]);
    return await ssher.execCommand(
      `command -v semanage && sudo semanage fcontext -a -t bin_t ${
        destination.split(":")[1]
      }`
    );
  }

  async restorecon(destination) {
    const ssher = new SSHer(destination.split(":")[0]);
    return await ssher.execCommand(
      `command -v restorecon && sudo restorecon -v ${destination.split(":")[1]}`
    );
  }
};
