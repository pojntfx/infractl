#!/usr/bin/env node

const deleteNetworkmanager = require("../lib/actions/deleteNetworkmanager");

require("../lib/asGenericAction")({
  args: "<user@ip> [otherTargets...]",
  action: commander =>
    commander.args.map(target =>
      deleteNetworkmanager(target).then(target =>
        console.log(`Network manager successfully deleted on ${target}.`)
      )
    )
});
