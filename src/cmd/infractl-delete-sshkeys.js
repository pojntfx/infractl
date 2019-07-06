#!/usr/bin/env node

require("../lib/asHetznerCloudAction")({
  args: "<id> [otherIds...]",
  action: (commander, hetznerCloud) =>
    commander.args.map(id =>
      hetznerCloud
        .deleteSSHKey(id)
        .then(() => console.log(`SSH key ${id} successfully deleted.`))
    )
});
