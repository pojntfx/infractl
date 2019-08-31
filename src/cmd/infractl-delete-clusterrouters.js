#!/usr/bin/env node

const deleteClusterrouter = require("../lib/actions/deleteClusterrouter");

require("../lib/asGenericAction")({
  options: [
    [
      "-c, --clusterconfig-path [kubeconfig]",
      "Path to the kubeconfig to work with (default ~/.kube/config)"
    ]
  ],
  action: async commander =>
    deleteClusterrouter(commander.clusterconfig).then(() =>
      console.log(`Cluster router successfully deleted.`)
    )
});
