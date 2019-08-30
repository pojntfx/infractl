#!/usr/bin/env node

const deleteClustermanager = require("../lib/actions/deleteClustermanager");

require("../lib/asGenericAction")({
  args: "<user@ip> [otherTargets...]",
  action: commander =>
    commander.args.map(target =>
      deleteClustermanager(target).then(target =>
        console.log(`Cluster manager successfully deleted on ${target}.`)
      )
    )
});
