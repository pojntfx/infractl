#!/usr/bin/env node

const Clusters = require("../lib/models/clusters");

require("../lib/asGenericAction")({
  args: "<user@ip>",
  checker: commander => commander.args[0],
  action: commander => {
    const clusters = new Clusters();
    clusters
      .getToken(commander.args[0])
      .then(token => token && console.log(token));
  }
});
