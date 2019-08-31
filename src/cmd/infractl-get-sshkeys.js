#!/usr/bin/env node

const SSHKeys = require("../lib/models/sshkeys");
const withTable = require("../lib/withTable");
const YAML = require("yaml");

require("../lib/asHetznerCloudAction")({
  args: "[id]",
  action: (commander, cloud) => {
    const sshKeys = new SSHKeys(cloud);
    sshKeys.get(commander.args[0]).then(sshKeys =>
      sshKeys.list
        ? withTable({
            headers: ["ID", "NAME", "FINGERPRINT"],
            data: sshKeys.data.ssh_keys.map(({ id, name, fingerprint }) => [
              id,
              name,
              fingerprint
            ])
          }).then(table => console.log(table))
        : console.log(YAML.stringify(sshKeys.data, null, 4))
    );
  }
});
