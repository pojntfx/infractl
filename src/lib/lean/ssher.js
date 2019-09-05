const SSH = require("node-ssh");
const shell = require("shelljs");
const fs = require("fs");
const os = require("os");

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

    const localInterfaces = Object.keys(os.networkInterfaces());
    const localIps = localInterfaces.map(name => {
      const localNetworkInterfaces = os.networkInterfaces();
      const localNetworkInterface = localNetworkInterfaces[name].find(
        subInterface => subInterface.family === "IPv4"
      );
      return (
        (localNetworkInterface && localNetworkInterface.address) || undefined
      );
    });
    if (localIps.includes(this.hostname)) {
      this.isLocal = true;
    }
  }

  async execCommand(command) {
    return new Promise(async resolve => {
      if (this.isLocal) {
        resolve(this.shell.exec(command, { silent: true }));
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
      return await this.shell.cp(source, destination);
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

  async chmod(destination, permissions) {
    if (this.isLocal) {
      return await this.shell.chmod(permissions, destination.split(":")[1]);
    } else {
      await this.execCommand(
        `chmod ${permissions} ${destination.split(":")[1]}`
      );
      return true;
    }
  }

  async getKey(source) {
    const newKey = await this.execCommand(`ssh-keyscan -t rsa ${source}`);
    await this.dispose();
    return newKey;
  }

  async trustKeys(newKeys, destination) {
    const workingNewKeys = newKeys.filter(Boolean);
    const rawTrustedKeys = await new Promise(resolve =>
      fs.readFile(destination, "UTF8", (_, data) => resolve(data))
    );
    const trustedKeys = rawTrustedKeys
      .split("\n")
      .filter(
        key =>
          !workingNewKeys.find(newKey => newKey.includes(key.split(" ")[0]))
      );
    const newTrustedKeys = [...trustedKeys, ...workingNewKeys].join("\n");
    return await new Promise(resolve =>
      fs.writeFile(destination, newTrustedKeys, () => resolve(destination))
    );
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
