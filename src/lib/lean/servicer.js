const fs = require("fs");
const SSH = require("node-ssh");

module.exports = class {
  async createService({ description, execStart, environment, destination }) {
    return new Promise(resolve =>
      fs.writeFile(
        destination,
        `[Unit]
Description=${description}
After=network.target

[Service]
ExecStart=${execStart}${environment && `\nEnvironment=${environment}`}

[Install]
WantedBy=multi-user.target
`,
        () => resolve(destination)
      )
    );
  }

  async reloadServices(destination) {
    const ssh = new SSH();
    await ssh.connect({
      host: destination.split("@")[1].split(":")[0],
      username: destination.split("@")[0],
      agent: process.env.SSH_AUTH_SOCK
    });
    await ssh.execCommand("systemctl daemon-reload");
    ssh.dispose();
    return true;
  }

  async startService(destination, name) {
    const ssh = new SSH();
    await ssh.connect({
      host: destination.split("@")[1].split(":")[0],
      username: destination.split("@")[0],
      agent: process.env.SSH_AUTH_SOCK
    });
    await ssh.execCommand(`sudo systemctl enable ${name} --now`);
    ssh.dispose();
    return true;
  }

  async stopService(destination, name) {
    const ssh = new SSH();
    await ssh.connect({
      host: destination.split("@")[1].split(":")[0],
      username: destination.split("@")[0],
      agent: process.env.SSH_AUTH_SOCK
    });
    await ssh.execCommand(`sudo systemctl stop ${name}`);
    ssh.dispose();
    return true;
  }
};
