const fs = require("fs");
const SSHer = require("./ssher");

module.exports = class {
  async createService({
    description,
    execStart,
    environment,
    destination,
    dontRestart
  }) {
    return new Promise(resolve =>
      fs.writeFile(
        destination,
        `[Unit]
Description=${description}
After=network.target

[Service]
ExecStart=${execStart}${environment ? `\nEnvironment=${environment}` : ""}${
          dontRestart ? "" : `\nRestart=always`
        }

[Install]
WantedBy=multi-user.target
`,
        () => resolve(destination)
      )
    );
  }

  async reloadServices(destination) {
    const ssher = new SSHer(destination);
    return await ssher.execCommand("sudo systemctl daemon-reload");
  }

  async enableService(destination, name) {
    const ssher = new SSHer(destination);
    return await ssher.execCommand(`sudo systemctl enable ${name} --now`);
  }

  async disableService(destination, name) {
    const ssher = new SSHer(destination);
    return await ssher.execCommand(`sudo systemctl disable ${name} --now`);
  }

  async getServiceStatus(destination, name) {
    const ssher = new SSHer(destination);
    const service = await ssher.execCommand(`sudo systemctl status ${name}`);
    return service.includes("Active: active (running)");
  }

  async waitForService(destination, name, interval) {
    const serviceStatus = await this.getServiceStatus(destination, name);
    return new Promise(resolve => {
      if (serviceStatus) {
        resolve(true);
      } else {
        setTimeout(
          () =>
            this.waitForService(destination, name, interval).then(() =>
              resolve(true)
            ),
          interval
        );
      }
    });
  }
};
