#!/usr/bin/env node

const deleteClusterhybrid = require("../lib/actions/deleteClusterhybrid");

require("../lib/asGenericAction")({
  args: "<user@ip> [otherTargets...]",
  action: commander =>
    commander.args.map(target =>
      deleteClusterhybrid(target).then(target =>
        console.log(`Cluster hybrid successfully deleted on ${target}.`)
      )
    )
});
