#!/usr/bin/env node

const Clusters = require("../lib/models/clusters");

require("../lib/asGenericAction")({
  args: "<user@ip> [otherTargets...]",
  options: [
    [
      "-u, --re-upload [true|false]",
      "Whether the networkmanager should be uploaded again if it already exists on the target (default false)"
    ],
    [
      "-i, --additional-ip [ip]",
      "Additional IP to provide certs for (i.e. 10.224.183.211)"
    ]
  ],
  action: commander => {
    const clusters = new Clusters();
    clusters.writeManager(commander.additionalIp).then(source =>
      commander.args.map(target =>
        clusters
          .uploadManager({
            source,
            target,
            reUpload: commander.reUpload
          })
          .then(target =>
            console.log(`Cluster manager successfully applied on ${target}.`)
          )
      )
    );
  }
});
