const crypto = require("crypto");

module.exports = class {
  async getRandomString(length) {
    return crypto.randomBytes(length).toString("base64");
  }
};
