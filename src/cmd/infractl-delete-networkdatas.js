#!/usr/bin/env node

const deleteNetworkdata = require("../lib/actions/deleteNetworkdata");

require("../lib/asGenericAction")({
  args: "<user@ip> [otherTargets...]",
  action: commander =>
    commander.args.map(target =>
      deleteNetworkdata(target).then(target =>
        console.log(`Network data successfully deleted on ${target}.`)
      )
    )
});
