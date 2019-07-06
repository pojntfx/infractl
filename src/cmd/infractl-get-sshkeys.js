#!/usr/bin/env node

const withTable = require("../lib/withTable");

require("../lib/asHetznerCloudAction")({
  args: "[id]",
  action: (commander, hetznerCloud) =>
    commander.args[0]
      ? hetznerCloud
          .getSSHKey(commander.args[0])
          .then(sshKey => console.log(JSON.stringify(sshKey, null, 4)))
      : hetznerCloud.getSSHKeys().then(sshKeys =>
          withTable({
            headers: ["ID", "NAME", "FINGERPRINT"],
            data: sshKeys.ssh_keys.map(({ id, name, fingerprint }) => [
              id,
              name,
              fingerprint
            ])
          }).then(table => console.log(table))
        )
});
