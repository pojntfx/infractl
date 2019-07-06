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

  async upsertNode(id, newNode) {
    const upsertedNode = await this.__fetch(id ? `servers/${id}` : "servers", {
      method: id ? "PUT" : "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(newNode)
    });
    return upsertedNode.json();
  }

  async updateNodeStatus(id, status) {
    const updatedNode = await this.__fetch(
      status
        ? `servers/${id}/actions/poweron`
        : `servers/${id}/actions/poweroff`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        }
      }
    );
    return updatedNode.json();
  }

  async deleteNode(id) {
    const deletedNode = await this.__fetch(`servers/${id}`, {
      method: "DELETE"
    });
    return deletedNode;
  }

  async getSSHKeys() {
    const sshKeys = await this.__fetch("ssh_keys");
    return sshKeys.json();
  }

  async getSSHKey(id) {
    const sshKey = await this.__fetch(`ssh_keys/${id}`);
    return sshKey.json();
  }
};
