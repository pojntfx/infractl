const shell = require("shelljs");

module.exports = class {
  constructor(cloud) {
    this.cloud = cloud;
  }

  async apply({ id, name, file }) {
    return this.cloud.upsertSSHKey(id || undefined, {
      name: name || undefined,
      public_key: (file && shell.cat(file)) || undefined
    });
  }

  async get(id) {
    return new Promise(resolve =>
      id
        ? this.cloud
            .getSSHKey(id)
            .then(sshKey => resolve({ list: false, data: sshKey }))
        : this.cloud.getSSHKeys().then(sshKeys =>
            resolve({
              list: true,
              data: sshKeys
            })
          )
    );
  }

  async delete(id) {
    return this.cloud.deleteSSHKey(id);
  }
};
