const shell = require("shelljs");

module.exports = class {
  async getPath(file) {
    return `${shell.tempdir()}/${file}`;
  }
};
