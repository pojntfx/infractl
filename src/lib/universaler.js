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
};
