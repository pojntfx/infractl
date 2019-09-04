const SSH = require("node-ssh");

module.exports = class {
  async setPermissions(destination, permissions) {
    const ssh = new SSH();
    await ssh.connect({
      host: destination.split("@")[1].split(":")[0],
      username: destination.split("@")[0],
      agent: process.env.SSH_AUTH_SOCK
    });
    await ssh.execCommand(`chmod ${permissions} ${destination.split(":")[1]}`);
    ssh.dispose();
    return true;
  }
};
