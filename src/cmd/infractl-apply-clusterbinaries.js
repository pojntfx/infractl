#!/usr/bin/env node

const Clusters = require("../lib/models/clusters");

require("../lib/asGenericAction")({
  args: "<user@ip> [otherTargets...]",
  options: [
    [
      "-s, --source [source]",
      "Cluster binary's source (default https://github.com/rancher/k3s/releases/download/v0.8.1/k3s)"
    ],
    [
      "-d, --re-download [true|false]",
      "Whether the binary should be downloaded again if it already exists locally (default false)"
    ],
    [
      "-u, --re-upload [true|false]",
      "Whether the binary should be uploaded again if it already exists on the target (default false)"
    ]
  ],
  action: async commander => {
    const clusters = new Clusters();
    clusters
      .downloadBinary({
        source: commander.source,
        reDownload: commander.reDownload
      })
      .then(destination =>
        commander.args.map(target =>
          clusters
            .uploadBinary({
              source: destination,
              target,
              reUpload: commander.reDownload
            })
            .then(target =>
              console.log(`Cluster binary successfully applied to ${target}.`)
            )
        )
      );
  }
});
