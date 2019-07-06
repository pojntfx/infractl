#!/usr/bin/env node

require("../lib/asHetznerCloudAction")({
  args: "<id> [otherIds...]",
  action: (commander, hetznerCloud) =>
    commander.args.map(id =>
      hetznerCloud
        .deleteNode(id)
        .then(() => console.log(`Node ${id} successfully deleted.`))
    )
});
