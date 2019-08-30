const withTable = require("../withTable");

module.exports = async ({ id, cloud }) =>
  id
    ? cloud
        .getSSHKey(id)
        .then(sshKey => console.log(JSON.stringify(sshKey, null, 4)))
    : cloud.getSSHKeys().then(sshKeys =>
        withTable({
          headers: ["ID", "NAME", "FINGERPRINT"],
          data: sshKeys.ssh_keys.map(({ id, name, fingerprint }) => [
            id,
            name,
            fingerprint
          ])
        }).then(table => console.log(table))
      );
