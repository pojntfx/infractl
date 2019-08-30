#!/usr/bin/env node

const deleteClusterworker = require("../lib/actions/deleteClusterworker");

require("../lib/asGenericAction")({
  args: "<user@ip> [otherTargets...]",
  action: commander =>
    commander.args.map(target =>
      deleteClusterworker(target).then(target =>
        console.log(`Cluster worker successfully deleted on ${target}.`)
      )
    )
});
