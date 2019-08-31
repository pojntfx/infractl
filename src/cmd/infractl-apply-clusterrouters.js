#!/usr/bin/env node

const applyClusterrouter = require("../lib/actions/applyClusterrouter");

require("../lib/asGenericAction")({
  options: [
    [
      "-c, --clusterconfig-path [kubeconfig]",
      "Path to the kubeconfig to work with (default ~/.kube/config)"
    ]
  ],
  action: async commander =>
    applyClusterrouter(commander.clusterconfig).then(() =>
      console.log(`Cluster router successfully applied.`)
    )
});
