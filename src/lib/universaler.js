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
      const sshKey = key.ssh_key ? key.ssh_key : key;
      const basicKey = {
        id: isUniversalId
          ? sshKey.id
          : await this.getSupracloudSSHKeyId("hetzner", sshKey.id),
        name: sshKey.name,
        fingerprint: sshKey.fingerprint
      };
      return withContent
        ? {
            ...basicKey,
            content: sshKey.public_key
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

  async getSupracloudNodeOS(from, os) {
    if (from === "hetzner") {
      let universalOS = "";

      switch (os) {
        case "debian-10":
          universalOS = "debian";
          break;
        case "centos-7":
          universalOS = "centos";
          break;
        case "ubuntu-18.04":
          universalOS = "ubuntu";
          break;
        case "fedora-30":
          universalOS = "fedora";
          break;
        default:
          universalOS = os;
      }

      return universalOS;
    } else {
      return false;
    }
  }

  async getProprietaryNodeOS(from, os) {
    if (from === "hetzner") {
      let proprietaryOS = "";

      switch (os) {
        case "debian":
          proprietaryOS = "debian-10";
          break;
        case "centos":
          proprietaryOS = "centos-7";
          break;
        case "ubuntu":
          proprietaryOS = "ubuntu-18.04";
          break;
        case "fedora":
          proprietaryOS = "fedora-30";
          break;
        default:
          proprietaryOS = os;
      }

      return proprietaryOS;
    } else {
      return false;
    }
  }

  async getSupracloudNode(from, node, isUniversalId) {
    if (from === "hetzner") {
      const server = node.server ? node.server : node;
      return {
        id: isUniversalId
          ? server.id
          : await this.getSupracloudNodeId("hetzner", server.id),
        name: server.name,
        publicAccess: `root@${server.public_net.ipv4.ip}`,
        location: server.datacenter.location.name,
        os: await this.getSupracloudNodeOS("hetzner", server.image.name),
        type: `${server.server_type.cores}-${server.server_type.memory}-${server.server_type.disk}`
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
