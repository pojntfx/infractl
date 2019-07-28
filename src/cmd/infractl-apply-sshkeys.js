#!/usr/bin/env node

const withTable = require("../lib/withTable");
const shell = require("shelljs");

require("../lib/asHetznerCloudAction")({
  args: "[id]",
  options: [
    [
      "-n, --ssh-key-name [name]",
      "SSH key's name (i.e. pojntfx@thinkpadx1c3.pojtinger.space)"
    ],
    [
      "-f, --ssh-key-file [file]",
      "Path to public SSH key (i.e. ~/.ssh/id_rsa.pub) (cannot be updated). Note: For all `ssh`-based connections from this client, ]`ssh-agent` needs to be used."
    ]
  ],
  checker: commander => commander.sshKeyName || commander.sshKeyFile,
  action: (commander, hetznerCloud) =>
    hetznerCloud
      .upsertSSHKey(commander.args[0] || undefined, {
        name: commander.sshKeyName || undefined,
        public_key:
          (commander.sshKeyFile && shell.cat(commander.sshKeyFile)) || undefined
      })
      .then(({ ssh_key: { id, name, fingerprint } }) => {
        withTable({
          preceedingText: "SSH key successfully applied:",
          headers: ["ID", "NAME", "FINGERPRINT"],
          data: [[id, name, fingerprint]]
        }).then(table => console.log(table));
      })
});
