const crypto = require("crypto");

module.exports = class {
  async getRandomString(length) {
    return crypto.randomBytes(length).toString("base64");
  }

  async getBase64(input) {
    return Buffer.from(input).toString("base64");
  }
};
