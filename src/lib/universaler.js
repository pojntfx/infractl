module.exports = class {
  async getSupracloudSSHKeyId(from, id) {
    if (from === "hetzner") {
      return `H-${id}`;
    } else {
      return false;
    }
  }

  async getProprietarySSHKeyId(to, id) {
    if (to === "hetzner") {
      return id.replace("H-", "");
    } else {
      return false;
    }
  }

  async getSupracloudSSHKey(from, key, withContent, isUniversalId) {
    if (from === "hetzner") {
      const basicKey = {
        id: isUniversalId
          ? key.ssh_key
            ? key.ssh_key.id
            : key.id
          : await this.getSupracloudSSHKeyId(
              "hetzner",
              key.ssh_key ? key.ssh_key.id : key.id
            ),
        name: key.ssh_key ? key.ssh_key.name : key.name,
        fingerprint: key.ssh_key ? key.ssh_key.fingerprint : key.fingerprint
      };
      return withContent
        ? {
            ...basicKey,
            content: key.ssh_key ? key.ssh_key.public_key : key.public_key
          }
        : basicKey;
    } else {
      return false;
    }
  }

  async getSupracloudSSHKeyList(from, keys) {
    if (from === "hetzner") {
      return keys.ssh_keys;
    } else {
      return false;
    }
  }

  async getSupracloudNodeId(from, id) {
    if (from === "hetzner") {
      return `H-${id}`;
    } else {
      return false;
    }
  }

  async getProprietaryNodeId(to, id) {
    if (to === "hetzner") {
      return id.replace("H-", "");
    } else {
      return false;
    }
  }

  async getSupracloudNode(from, node, isUniversalId) {
    if (from === "hetzner") {
      return {
        id: isUniversalId
          ? node.server
            ? node.server.id
            : node.id
          : await this.getSupracloudNodeId(
              "hetzner",
              node.server ? node.server.id : node.id
            ),
        name: node.server ? node.server.name : node.name,
        publicAccess: node.server
          ? `root@${node.server.public_net.ipv4.ip}`
          : `root@${node.public_net.ipv4.ip}`,
        os: node.server ? node.server.image.name : node.image.name,
        cores: node.server
          ? node.server.server_type.cores
          : node.server_type.cores,
        memory: node.server
          ? node.server.server_type.memory
          : node.server_type.memory,
        disk: node.server ? node.server.server_type.disk : node.server_type.disk
      };
    } else {
      return false;
    }
  }

  async getSupracloudNodeList(from, keys) {
    if (from === "hetzner") {
      return keys.servers;
    } else {
      return false;
    }
  }
};
