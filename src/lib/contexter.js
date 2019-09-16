const Configstore = require("configstore");

module.exports = class {
  constructor(app) {
    this.configstore = new Configstore(app);
  }

  async setHetznerEndpoint(endpoint) {
    return this.configstore.set("hetznerEndpoint", endpoint);
  }

  async getHetznerEndpoint() {
    return this.configstore.get("hetznerEndpoint");
  }

  async setHetznerToken(token) {
    return this.configstore.set("hetznerToken", token);
  }

  async getHetznerToken() {
    return this.configstore.get("hetznerToken");
  }

  async getHetznerContextStatus() {
    return (await this.getHetznerEndpoint()) && (await this.getHetznerToken());
  }

  async getAll() {
    return this.configstore.all;
  }
};
