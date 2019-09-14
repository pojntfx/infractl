const SSH = require("node-ssh");
const shell = require("shelljs");
const fs = require("fs");
const os = require("os");
const Hostnamer = require("./hostnamer");

module.exports = class {
  constructor(connectionString) {
    this.user = connectionString.split("@")[0];
    this.hostname = connectionString.split("@")[1];

    const hostnamer = new Hostnamer();
    const localUser = hostnamer.getUsername();
    const localHostname = hostnamer.getHostname();
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
        const outputRaw = this.shell.exec(command, { silent: true });
        resolve(outputRaw.stdout);
      } else {
        await this.shell.connect({
          host: this.hostname,
          username: this.user,
          agent: process.env.SSH_AUTH_SOCK,
          readyTimeout: 500000
        });
        const outputRaw = await this.shell.execCommand(command);
        this.dispose();
        resolve(outputRaw.stdout);
      }
    });
  }

  async putFile(source, destination, withSudo) {
    if (this.isLocal) {
      if (!(source === destination)) {
        if (withSudo) {
          return await this.shell.exec(`sudo cp ${source} ${destination}`);
        } else {
          return await this.shell.cp(source, destination);
        }
      } else {
        return true;
      }
    } else {
      await this.shell.connect({
        host: this.hostname,
        username: this.user,
        agent: process.env.SSH_AUTH_SOCK,
        readyTimeout: 500000
      });
      let res = {};
      if (withSudo) {
        const filePath = destination.split("/");
        const fileName = filePath[filePath.length - 1];
        const temporaryDestination = `/tmp/${fileName}`;
        await this.shell.putFile(source, temporaryDestination);
        this.dispose();
        res = await this.execCommand(
          `sudo mv ${temporaryDestination} ${destination}`
        );
      } else {
        res = await this.shell.putFile(source, destination);
      }
      this.dispose();
      return res;
    }
  }

  async mkdir(destination, withSudo) {
    if (this.isLocal && !withSudo) {
      return await this.shell.mkdir("-p", destination.split(":")[1]);
    } else {
      return await this.execCommand(
        `${withSudo ? "sudo" : ""} mkdir -p ${destination.split(":")[1]}`
      );
    }
  }

  async chmod(destination, permissions, withSudo) {
    if (this.isLocal && !withSudo) {
      return await this.shell.chmod(permissions, destination.split(":")[1]);
    } else {
      return await this.execCommand(
        `${withSudo ? "sudo" : ""} chmod ${permissions} ${
          destination.split(":")[1]
        }`
      );
    }
  }

  async rm(destination, recursive, withSudo) {
    if (this.isLocal && !withSudo) {
      return await this.shell.rm(
        `${recursive ? "-rf" : "-f"}`,
        destination.split(":")[1]
      );
    } else {
      return await this.execCommand(
        `${withSudo ? "sudo" : ""} rm ${recursive ? "-rf" : "-f"} ${
          destination.split(":")[1]
        }`
      );
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
