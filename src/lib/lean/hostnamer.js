const os = require("os");

module.exports = class {
  getHostname() {
    return os.hostname();
  }
};
