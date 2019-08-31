#!/usr/bin/env node

const Networks = require("../lib/models/networks");

require("../lib/asGenericAction")({
  args: "<user@ip>",
  checker: commander => commander.args[0],
  action: commander => {
    const networks = new Networks();
    networks
      .getToken(commander.args[0])
      .then(token => token && console.log(token));
  }
});
