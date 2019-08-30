#!/usr/bin/env node

const deleteSSHKey = require("../lib/actions/deleteSSHKey");

require("../lib/asHetznerCloudAction")({
  args: "<id> [otherIds...]",
  action: (commander, cloud) =>
    commander.args.map(id =>
      deleteSSHKey({
        id,
        cloud
      })
    )
});
