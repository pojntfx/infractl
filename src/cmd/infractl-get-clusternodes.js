#!/usr/bin/env node

const withTable = require("../lib/withTable");
const YAML = require("yaml");
const Clusters = require("../lib/models/clusters");

require("../lib/asGenericAction")({
  args: "[id]",
  options: [
    [
      "-c, --clusterconfig-path [kubeconfig]",
      "Path to the kubeconfig to work with (default ~/.kube/config)"
    ]
  ],
  action: async commander => {
    const clusters = new Clusters();
    clusters
      .getNodes({
        clusterconfig: commander.clusterconfig,
        name: commander.args[0]
      })
      .then(nodes =>
        nodes.list
          ? withTable({
              headers: ["ID", "READY", "EXTERNAL-IP"],
              data: nodes.data.map(node => [
                node.metadata.name,
                JSON.stringify(
                  !(
                    node.status.conditions.find(
                      condition => condition.type === "Ready"
                    ).status === "False"
                  )
                ),
                node.status.addresses.find(
                  address => address.type === "InternalIP"
                )["address"]
              ])
            }).then(table => console.log(table))
          : console.log(YAML.stringify(nodes.data, null, 4))
      );
  }
});
