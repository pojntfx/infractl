#!/usr/bin/env node

const deleteNetworkbinary = require("../lib/actions/deleteNetworkbinaries");

require("../lib/asGenericAction")({
  args: "<user@ip> [otherTargets...]",
  action: commander =>
    commander.args.map(target =>
      deleteNetworkbinary(target).then(target =>
        console.log(`Network binary successfully deleted on ${target}.`)
      )
    )
});
