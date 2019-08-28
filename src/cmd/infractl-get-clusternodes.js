#!/usr/bin/env node

const { Client, KubeConfig } = require("kubernetes-client");
const Request = require("kubernetes-client/backends/request");
const withTable = require("../lib/withTable");

require("../lib/asGenericAction")({
  args: "[name]",
  options: [
    [
      "-c, --clusterconfig-path [kubeconfig]",
      "Path to the kubeconfig to work with (default ~/.kube/config)"
    ]
  ],
  action: async commander => {
    let client = {};
    if (commander.clusterconfig) {
      const kubeconfig = new KubeConfig();
      kubeconfig.loadFromFile(commander.clusterconfig);
      const backend = new Request({ kubeconfig });
      client = new Client({
        backend
      });
    } else {
      client = new Client();
    }
    await client.loadSpec();
    if (commander.args[0]) {
      await client.api.v1
        .nodes(commander.args[0])
        .get()
        .then(res => console.log(JSON.stringify(res.body, null, 4)));
    } else {
      await client.api.v1.nodes.get().then(res =>
        withTable({
          headers: ["NAME", "READY"],
          data: res.body.items.map(node => [
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
      );
    }
  }
});
