#!/usr/bin/env node

const getNetworktoken = require("../lib/actions/getNetworktoken");

require("../lib/asGenericAction")({
  args: "<user@ip>",
  checker: commander => commander.args[0],
  action: commander =>
    getNetworktoken(commander.args[0]).then(
      token => token && console.log(token)
    )
});
