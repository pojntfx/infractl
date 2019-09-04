const fs = require("fs");

module.exports = class {
  async createService({ description, execStart, destination }) {
    return new Promise(resolve =>
      fs.writeFile(
        destination,
        `[Unit]
Description=${description}
After=network.target

[Service]
ExecStart=${execStart}

[Install]
WantedBy=multi-user.target
`,
        () => resolve(destination)
      )
    );
  }
};
