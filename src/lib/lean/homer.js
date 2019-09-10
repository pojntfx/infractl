const os = require("os");

module.exports = class {
  getHomeDirectory() {
    return os.homedir();
  }
};
