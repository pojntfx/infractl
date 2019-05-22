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
          Authorization: `bearer ${this.accessToken}`
        }
      })
    );
  }

  async getNetworks() {
    const networks = await this.__fetch("network");
    return networks.json();
  }

  async getNetwork(id) {
    const network = await this.__fetch(`network/${id}`);
    return network.json();
  }

  async upsertNetwork(id, newNetwork) {
    const upsertedNetwork = await this.__fetch(
      id ? `network/${id}` : "network",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(newNetwork)
      }
    );
    return upsertedNetwork.json();
  }

  async deleteNetwork(id) {
    const deletedNetwork = await this.__fetch(`network/${id}`, {
      method: "DELETE"
    });
    return deletedNetwork;
  }

  async getNetworkMembers(networkId) {
    const networkMembers = await this.__fetch(`network/${networkId}/member`);
    return networkMembers.json();
  }

  async getNetworkMember(networkId, nodeId) {
    const networkMember = await this.__fetch(
      `network/${networkId}/member/${nodeId}`
    );
    return networkMember.json();
  }

  async updateNetworkMember(networkId, nodeId, newNetworkMember) {
    const updatedNetworkMember = await this.__fetch(
      `network/${networkId}/member/${nodeId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(newNetworkMember)
      }
    );
    return updatedNetworkMember.json();
  }
};
