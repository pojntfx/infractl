#!/usr/bin/env node

require("../lib/asZeroTierAction")({
  args: "<id> [otherIds...]",
  action: (commander, zerotier) =>
    commander.args.map(id =>
      zerotier
        .deleteNetwork(id)
        .then(() => console.log(`Network ${id} successfully deleted.`))
    )
});
