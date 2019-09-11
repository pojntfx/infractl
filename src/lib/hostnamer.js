const os = require("os");

module.exports = class {
  getHostname() {
    return os.hostname();
  }

  getUsername() {
    return os.userInfo().username;
  }

  getAddress() {
    return `${this.getUsername()}@${this.getHostname()}`;
  }
};
