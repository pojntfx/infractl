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
      return `H-${nodeType}`;
    } else {
      return false;
    }
  }

  async getProprietaryTypeId(to, nodeType) {
    if (to === "hetzner") {
      return nodeType.replace("H-", "");
    } else {
      return false;
    }
  }

  async getSupracloudNode(from, node, isUniversalId) {
    if (from === "hetzner") {
      const server = node.server ? node.server : node;

      if (server.error) {
        return false;
      }

      return {
        id: isUniversalId
          ? server.id
          : await this.getSupracloudNodeId("hetzner", server.id),
        name: server.name,
        ips: {
          public: server.public_net.ipv4.ip
        },
        location: await this.getSupracloudLocationId(
          "hetzner",
          server.datacenter.location.id
        ),
        type: await this.getSupracloudTypeId("hetzner", server.server_type.id),
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
          : await this.getSupracloudLocationId("hetzner", datacenter.id),
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

  async getSupracloudType(from, nodeType, withSpecifications, isUniversalId) {
    if (from === "hetzner") {
      const machineType = nodeType.server_type
        ? nodeType.server_type
        : nodeType;

      if (machineType.error) {
        return false;
      }

      const prices = machineType.prices.sort(
        (a, b) => a.price_hourly.gross < b.price_hourly.gross
      )[0];
      const basicType = {
        id: isUniversalId
          ? machineType.id
          : await this.getSupracloudTypeId("hetzner", machineType.id),
        name: machineType.name,
        prices: {
          hourly: `${Math.round(prices.price_hourly.gross * 10000) / 10000} €`,
          monthly: `${Math.round(prices.price_monthly.gross * 10000) / 10000} €`
        }
      };

      return withSpecifications
        ? {
            ...basicType,
            description: machineType.description,
            cores: machineType.cores,
            memory: `${machineType.memory} GB`,
            disk: `${machineType.disk} GB`
          }
        : basicType;
    } else {
      return false;
    }
  }

  async getSupracloudTypeList(from, types) {
    if (from === "hetzner") {
      return types.server_types.filter(
        nodeType => !nodeType.name.includes("-ceph")
      );
    } else {
      return false;
    }
  }
};
