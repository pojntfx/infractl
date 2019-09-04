const SSH = require("node-ssh");

module.exports = class {
  async upload(source, destination) {
    const ssh = new SSH();
    return new Promise(resolve =>
      ssh
        .connect({
          host: destination.split("@")[1].split(":")[0],
          username: destination.split("@")[0],
          agent: process.env.SSH_AUTH_SOCK
        })
        .then(() => ssh.putFile(source, destination.split(":")[1]))
        .then(() => {
          ssh.dispose();
          resolve(true);
        })
    );
  }
};
