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

  async getSupracloudLocationName(from, name) {
    if (from === "hetzner") {
      return `H-${name}`;
    } else {
      return false;
    }
  }

  async getProprietaryLocationName(to, name) {
    if (to === "hetzner") {
      return name.replace("H-", "");
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

  async getProprietaryNodeOS(to, os) {
    if (to === "hetzner") {
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

  async getSupracloudNodeType(from, nodeType) {
    if (from === "hetzner") {
      let proprietaryNodeType = "";

      switch (nodeType) {
        case "cx11":
          proprietaryNodeType = "1-2-20";
          break;
        case "cx21":
          proprietaryNodeType = "2-4-40";
          break;
        case "cx31":
          proprietaryNodeType = "2-8-80";
          break;
        case "cx41":
          proprietaryNodeType = "4-16-160";
          break;
        case "cx51":
          proprietaryNodeType = "8-32-240";
          break;
        default:
          proprietaryNodeType = nodeType;
      }

      return proprietaryNodeType;
    } else {
      return false;
    }
  }

  async getProprietaryNodeType(to, nodeType) {
    if (to === "hetzner") {
      let supracloudNodeType = "";

      switch (nodeType) {
        case "1-2-20":
          supracloudNodeType = "cx11";
          break;
        case "2-4-40":
          supracloudNodeType = "cx21";
          break;
        case "2-8-80":
          supracloudNodeType = "cx31";
          break;
        case "4-16-160":
          supracloudNodeType = "cx41";
          break;
        case "8-32-240":
          supracloudNodeType = "cx51";
          break;
        default:
          supracloudNodeType = nodeType;
      }

      return supracloudNodeType;
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
        location: await this.getSupracloudLocationName(
          "hetzner",
          server.datacenter.location.name
        ),
        os: await this.getSupracloudNodeOS("hetzner", server.image.name),
        type: await this.getSupracloudNodeType(
          "hetzner",
          server.server_type.name
        )
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
