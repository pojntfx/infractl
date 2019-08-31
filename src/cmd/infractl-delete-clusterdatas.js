#!/usr/bin/env node

const deleteClusterdata = require("../lib/actions/deleteClusterdata");

require("../lib/asGenericAction")({
  args: "<user@ip> [otherTargets...]",
  action: commander =>
    commander.args.map(target =>
      deleteClusterdata(target).then(target =>
        console.log(`Cluster data successfully deleted on ${target}.`)
      )
    )
});
