#!/usr/bin/env node

const getClusterconfig = require("../lib/actions/getClusterconfig");

require("../lib/asGenericAction")({
  args: "<user@ip>",
  checker: commander => commander.args[0],
  action: commander =>
    getClusterconfig(commander.args[0]).then(
      config => config && console.log(config)
    )
});
