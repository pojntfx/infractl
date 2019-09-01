const SSH = require("node-ssh");
const shell = require("shelljs");

module.exports = async (address, functionToCall) => {
  const ssh = new SSH();
  const host = address.split("@")[1];
  const username = address.split("@")[0];
  if (host === "localhost" && username === process.env.USER) {
    const SSHLocal = class {
      constructor() {
        this.isLocal = true;
      }

      async execCommand(command) {
        return new Promise(resolve => {
          resolve(shell.exec(command));
        });
      }

      dispose() {}
    };
    functionToCall(new SSHLocal());
  } else {
    ssh
      .connect({
        host,
        username,
        agent: process.env.SSH_AUTH_SOCK
      })
      .then(() => functionToCall(ssh));
  }
};
