#!/usr/bin/env node

const Clusters = require("../lib/models/clusters");

require("../lib/asGenericAction")({
  args: "<user@ip>",
  checker: commander => commander.args[0],
  action: commander => {
    const clusters = new Clusters();
    clusters
      .getConfig(commander.args[0])
      .then(config => config && console.log(config));
  }
});
