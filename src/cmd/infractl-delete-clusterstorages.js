#!/usr/bin/env node

const deleteClusterstorage = require("../lib/actions/deleteClusterstorage");

require("../lib/asGenericAction")({
  options: [
    [
      "-c, --clusterconfig-path [kubeconfig]",
      "Path to the kubeconfig to work with (default ~/.kube/config)"
    ]
  ],
  action: async commander =>
    deleteClusterstorage(commander.clusterconfig).then(() =>
      console.log(`Cluster storage successfully deleted.`)
    )
});
