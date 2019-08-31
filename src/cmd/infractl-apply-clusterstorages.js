#!/usr/bin/env node

const applyClusterstorage = require("../lib/actions/applyClusterstorage");

require("../lib/asGenericAction")({
  options: [
    [
      "-c, --clusterconfig-path [kubeconfig]",
      "Path to the kubeconfig to work with (default ~/.kube/config)"
    ]
  ],
  action: async commander =>
    applyClusterstorage(commander.clusterconfig).then(() =>
      console.log(`Cluster storage successfully applied.`)
    )
});
