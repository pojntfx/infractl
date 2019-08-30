const withTable = require("../withTable");
const shell = require("shelljs");

module.exports = async ({ cloud, id, name, file }) =>
  cloud
    .upsertSSHKey(id || undefined, {
      name: name || undefined,
      public_key: (file && shell.cat(file)) || undefined
    })
    .then(({ ssh_key: { id, name, fingerprint } }) => {
      withTable({
        preceedingText: "SSH key successfully applied:",
        headers: ["ID", "NAME", "FINGERPRINT"],
        data: [[id, name, fingerprint]]
      }).then(table => console.log(table));
    });
