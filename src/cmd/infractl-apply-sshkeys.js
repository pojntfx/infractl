#!/usr/bin/env node

const applySSHKey = require("../lib/actions/applySSHKey");

require("../lib/asHetznerCloudAction")({
  args: "[id]",
  options: [
    [
      "-n, --ssh-key-name [name]",
      "SSH key's name (i.e. pojntfx@thinkpadx1c3.pojtinger.space)"
    ],
    [
      "-f, --ssh-key-file [file]",
      "Path to public SSH key (i.e. ~/.ssh/id_rsa.pub) (cannot be updated). Note: For all `ssh`-based connections from Infractl, `ssh-agent` needs to be used."
    ]
  ],
  checker: commander => commander.sshKeyName || commander.sshKeyFile,
  action: (commander, cloud) =>
    applySSHKey({
      id: commander.args[0],
      name: commander.sshKeyName,
      file: commander.sshKeyFile,
      cloud
    })
});
