#!/usr/bin/env node

const deleteNetworkworker = require("../lib/actions/deleteNetworkworker");

require("../lib/asGenericAction")({
  args: "<user@ip> [otherTargets...]",
  action: commander =>
    commander.args.map(target =>
      deleteNetworkworker(target).then(target =>
        console.log(`Network worker successfully deleted on ${target}.`)
      )
    )
});
