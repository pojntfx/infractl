#!/usr/bin/env node

const Clusters = require("../lib/models/clusters");

require("../lib/asGenericAction")({
  args: "<user@ip> [otherTargets...]",
  options: [
    [
      "-t, --cluster-token [clustertoken]",
      "Worker's cluster token (i.e. bb25f9c6::node:6bf075c)"
    ],
    ["-m, --manager [manager]", "Worker's manager (i.e. 195.201.22.140)"],
    [
      "-u, --re-upload [true|false]",
      "Whether the networkworker should be uploaded again if it already exists on the target (default false)"
    ]
  ],
  checker: commander => commander.clusterToken && commander.manager,
  action: commander => {
    const clusters = new Clusters();
    clusters
      .writeWorker({
        clusterToken: commander.clusterToken,
        manager: commander.manager
      })
      .then(source =>
        commander.args.map(target =>
          clusters
            .uploadWorker({
              source,
              target,
              reUpload: commander.reUpload
            })
            .then(target =>
              console.log(`Cluster worker successfully applied on ${target}.`)
            )
        )
      );
  }
});
