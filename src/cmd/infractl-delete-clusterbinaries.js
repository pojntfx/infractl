#!/usr/bin/env node

const deleteClusterbinary = require("../lib/actions/deleteClusterbinary");

require("../lib/asGenericAction")({
  args: "<user@ip> [otherTargets...]",
  action: commander =>
    commander.args.map(target =>
      deleteClusterbinary(target).then(target =>
        console.log(`Cluster binary successfully deleted on ${target}.`)
      )
    )
});
