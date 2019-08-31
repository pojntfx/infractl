#!/usr/bin/env node

const getClustertoken = require("../lib/actions/getClustertoken");

require("../lib/asGenericAction")({
  args: "<user@ip>",
  checker: commander => commander.args[0],
  action: commander =>
    getClustertoken(commander.args[0]).then(
      token => token && console.log(token)
    )
});
