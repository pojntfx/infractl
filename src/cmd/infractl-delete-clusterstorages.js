#!/usr/bin/env node

const Clusters = require("../lib/models/clusters");

require("../lib/asGenericAction")({
  options: [
    [
      "-c, --clusterconfig-path [kubeconfig]",
      "Path to the kubeconfig to work with (default ~/.kube/config)"
    ]
  ],
  action: async commander => {
    const clusters = new Clusters();
    clusters
      .deleteStorage(commander.clusterconfig)
      .then(() => console.log(`Cluster storage successfully deleted.`));
  }
});
