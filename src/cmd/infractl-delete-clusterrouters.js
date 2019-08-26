#!/usr/bin/env node

const { Client, KubeConfig } = require("kubernetes-client");
const Request = require("kubernetes-client/backends/request");

require("../lib/asGenericAction")({
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
    await client.api.v1
      .namespaces("kube-system")
      .configmaps("kube-proxy")
      .delete();
    await client.api.v1
      .namespaces("kube-system")
      .configmaps("kube-router-cfg")
      .delete();
    await client.apis.extensions.v1beta1
      .namespaces("kube-system")
      .daemonsets("kube-router")
      .delete();
    for (pod of (await client.api.v1
      .namespaces("kube-system")
      .pods.get()).body.items
      .filter(pod => pod.metadata.name.includes("kube-router-"))
      .map(pod => pod.metadata.name)) {
      await client.api.v1
        .namespaces("kube-system")
        .pods(pod)
        .delete();
    }
    await client.api.v1
      .namespaces("kube-system")
      .serviceaccounts("kube-router")
      .delete();
    await client.apis["rbac.authorization.k8s.io"].v1beta1
      .clusterroles("kube-router")
      .delete();
    await client.apis["rbac.authorization.k8s.io"].v1beta1
      .clusterrolebindings("kube-router")
      .delete();
    console.log(`Cluster router successfully deleted.`);
  }
});
