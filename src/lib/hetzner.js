const fetch = require("node-fetch");
const _ = require("lodash");

module.exports = class {
  constructor({ endpoint, token }) {
    this.endpoint = endpoint;
    this.token = token;
  }

  __fetch(path, args) {
    return fetch(
      `${this.endpoint}/${path}`,
      _.merge(args, {
        headers: {
          Authorization: `Bearer ${this.token}`
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

  async upsertSSHKey(id, newKey) {
    const upsertedSSHKey = await this.__fetch(
      id ? `ssh_keys/${id}` : "ssh_keys",
      {
        method: id ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(newKey)
      }
    );
    return upsertedSSHKey.json();
  }

  async deleteSSHKey(id) {
    const deletedSSHKey = await this.__fetch(`ssh_keys/${id}`, {
      method: "DELETE"
    });
    return deletedSSHKey;
  }

  async getLocations() {
    const locations = await this.__fetch("locations");
    return locations.json();
  }

  async getLocation(id) {
    const location = await this.__fetch(`locations/${id}`);
    return location.json();
  }

  async getOSes() {
    const oses = await this.__fetch("images?status=available&type=system");
    return oses.json();
  }

  async getOS(id) {
    const os = await this.__fetch(`images/${id}`);
    return os.json();
  }
};
