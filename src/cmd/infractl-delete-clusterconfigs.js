#!/usr/bin/env node

const deleteClusterconfig = require("../lib/actions/deleteClusterconfig");

require("../lib/asGenericAction")({
  args: "<user@ip> [otherTargets...]",
  action: commander =>
    commander.args.map(target =>
      deleteClusterconfig(target).then(target =>
        console.log(`Cluster config successfully deleted on ${target}.`)
      )
    )
});
