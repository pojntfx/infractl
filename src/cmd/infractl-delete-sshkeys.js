#!/usr/bin/env node

const SSHKeys = require("../lib/models/sshkeys");

require("../lib/asHetznerCloudAction")({
  args: "<id> [otherIds...]",
  action: (commander, cloud) => {
    const sshKeys = new SSHKeys(cloud);
    commander.args.map(id =>
      sshKeys
        .delete(id)
        .then(() => console.log(`SSH key ${id} successfully deleted.`))
    );
  }
});
