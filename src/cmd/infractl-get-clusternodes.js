#!/usr/bin/env node

const withTable = require("../lib/withTable");
const getClusternode = require("../lib/actions/getClusternode");

require("../lib/asGenericAction")({
  args: "[name]",
  options: [
    [
      "-c, --clusterconfig-path [kubeconfig]",
      "Path to the kubeconfig to work with (default ~/.kube/config)"
    ]
  ],
  action: async commander =>
    getClusternode({
      clusterconfig: commander.clusterconfig,
      name: commander.args[0]
    }).then(nodes =>
      nodes.list
        ? withTable({
            headers: ["NAME", "READY"],
            data: nodes.data.map(node => [
              node.metadata.name,
              JSON.stringify(
                !(
                  node.status.conditions.find(
                    condition => condition.type === "Ready"
                  ).status === "False"
                )
              )
            ])
          }).then(table => console.log(table))
        : console.log(JSON.stringify(nodes.data, null, 4))
    )
});
