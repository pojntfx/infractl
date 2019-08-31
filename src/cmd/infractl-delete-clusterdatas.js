#!/usr/bin/env node

const Clusters = require("../lib/models/clusters");

require("../lib/asGenericAction")({
  args: "<user@ip> [otherTargets...]",
  action: commander => {
    const clusters = new Clusters();
    commander.args.map(target =>
      clusters
        .deleteData(target)
        .then(target =>
          console.log(`Cluster data successfully deleted on ${target}.`)
        )
    );
  }
});
