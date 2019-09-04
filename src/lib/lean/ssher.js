const SSH = require("node-ssh");
const shell = require("shelljs");

module.exports = class {
  constructor(connectionString) {
    this.user = connectionString.split("@")[0];
    this.hostname = connectionString.split("@")[1];

    const localUser = process.env.USER;
    const localHostname = process.env.HOSTNAME;
    const localAlternativeHostname = "localhost";

    if (
      this.user === localUser &&
      (this.hostname === localHostname ||
        this.hostname === localAlternativeHostname)
    ) {
      this.isLocal = true;
      this.shell = shell;
    } else {
      this.isLocal = false;
      this.shell = new SSH();
    }
  }

  async execCommand(command) {
    return new Promise(async resolve => {
      if (this.isLocal) {
        resolve(this.shell.exec(command));
      } else {
        await this.shell.connect({
          host: this.hostname,
          username: this.user,
          agent: process.env.SSH_AUTH_SOCK
        });
        const outputRaw = await this.shell.execCommand(command);
        this.dispose();
        resolve(outputRaw.stdout);
      }
    });
  }

  async putFile(source, destination) {
    if (this.isLocal) {
      return this.shell.cp(source, destination);
    } else {
      await this.shell.connect({
        host: this.hostname,
        username: this.user,
        agent: process.env.SSH_AUTH_SOCK
      });
      await this.shell.putFile(source, destination);
      this.dispose();
      return true;
    }
  }

  dispose() {
    if (!this.isLocal) {
      this.shell.dispose();
      return true;
    } else {
      return true;
    }
  }
};
