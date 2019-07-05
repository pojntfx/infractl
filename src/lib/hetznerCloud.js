const fetch = require("node-fetch");
const _ = require("lodash");

module.exports = class {
  constructor({ endpoint, accessToken }) {
    this.endpoint = endpoint;
    this.accessToken = accessToken;
  }

  __fetch(path, args) {
    return fetch(
      `${this.endpoint}/${path}`,
      _.merge(args, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`
        }
      })
    );
  }

  async getNodes() {
    const node = await this.__fetch("servers");
    return node.json();
  }

  async getNode(id) {
    const nodes = await this.__fetch(`servers/${id}`);
    return nodes.json();
  }
};
