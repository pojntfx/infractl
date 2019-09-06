const SSHer = require("./ssher");

module.exports = class {
  async setenforce(destination, mode) {
    const ssher = new SSHer(destination);
    await ssher.execCommand(
      `command -v setenforce && sudo sentenforce ${mode}`
    );
    return true;
  }

  async semanage(destination) {
    const ssher = new SSHer(destination.split(":")[0]);
    await ssher.execCommand(
      `command -v semanage && sudo semanage fcontext -a -t bin_t ${
        destination.split(":")[1]
      }`
    );
    return true;
  }

  async restorecon(destination) {
    const ssher = new SSHer(destination.split(":")[0]);
    await ssher.execCommand(
      `command -v restorecon && sudo restorecon -v ${destination.split(":")[1]}`
    );
    return true;
  }
};
