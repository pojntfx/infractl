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

  async getSupracloudLocationId(from, name) {
    if (from === "hetzner") {
      return `H-${name}`;
    } else {
      return false;
    }
  }

  async getProprietaryLocationId(to, name) {
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

  async getSupracloudOSId(from, os) {
    if (from === "hetzner") {
      return `H-${os}`;
    } else {
      return false;
    }
  }

  async getProprietaryOSId(to, os) {
    if (to === "hetzner") {
      return os.replace("H-", "");
    } else {
      return false;
    }
  }

  async getSupracloudTypeId(from, nodeType) {
    if (from === "hetzner") {
      let proprietaryNodeType = "";

      switch (nodeType) {
        case "cx11":
          proprietaryNodeType = "H-1-2-20";
          break;
        case "cx21":
          proprietaryNodeType = "H-2-4-40";
          break;
        case "cx31":
          proprietaryNodeType = "H-2-8-80";
          break;
        case "cx41":
          proprietaryNodeType = "H-4-16-160";
          break;
        case "cx51":
          proprietaryNodeType = "H-8-32-240";
          break;
        default:
          proprietaryNodeType = nodeType;
      }

      return proprietaryNodeType;
    } else {
      return false;
    }
  }

  async getProprietaryTypeId(to, nodeType) {
    if (to === "hetzner") {
      let supracloudNodeType = "";

      switch (nodeType) {
        case "H-1-2-20":
          supracloudNodeType = "cx11";
          break;
        case "H-2-4-40":
          supracloudNodeType = "cx21";
          break;
        case "H-2-8-80":
          supracloudNodeType = "cx31";
          break;
        case "H-4-16-160":
          supracloudNodeType = "cx41";
          break;
        case "H-8-32-240":
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
        location: await this.getSupracloudLocationId(
          "hetzner",
          server.datacenter.location.id
        ),
        type: await this.getSupracloudTypeId(
          "hetzner",
          server.server_type.name
        ),
        os: await this.getSupracloudOSId("hetzner", server.image.id)
      };
    } else {
      return false;
    }
  }

  async getSupracloudNodeList(from, nodes) {
    if (from === "hetzner") {
      return nodes.servers;
    } else {
      return false;
    }
  }

  async getSupracloudLocation(from, location, withDescription, isUniversalId) {
    if (from === "hetzner") {
      const datacenter = location.location ? location.location : location;
      const basicLocation = {
        id: isUniversalId
          ? datacenter.id
          : await this.getSupracloudNodeId("hetzner", datacenter.id),
        name: datacenter.name,
        latitude: datacenter.latitude,
        longitude: datacenter.longitude
      };

      return withDescription
        ? {
            ...basicLocation,
            description: `${datacenter.description}, ${datacenter.city}, ${datacenter.country}`
          }
        : basicLocation;
    } else {
      return false;
    }
  }

  async getSupracloudLocationList(from, locations) {
    if (from === "hetzner") {
      return locations.locations;
    } else {
      return false;
    }
  }

  async getSupracloudOS(from, os, withHumanName, isUniversalId) {
    if (from === "hetzner") {
      const image = os.image ? os.image : os;
      const basicOS = {
        id: isUniversalId
          ? image.id
          : await this.getSupracloudOSId("hetzner", image.id),
        name: image.name
      };

      return withHumanName
        ? {
            ...basicOS,
            description: image.description
          }
        : basicOS;
    } else {
      return false;
    }
  }

  async getSupracloudOSList(from, oses) {
    if (from === "hetzner") {
      return oses.images;
    } else {
      return false;
    }
  }
};
