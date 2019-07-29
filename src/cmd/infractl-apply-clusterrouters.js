#!/usr/bin/env node

const { Client, KubeConfig } = require("kubernetes-client");
const Request = require("kubernetes-client/backends/request");
let kubeRouterCfg = require("../data/kube-router-cfg.json");
const kubeRouterDaemonset = require("../data/kube-router-daemonset.json");
const kubeRouterServiceaccount = require("../data/kube-router-serviceaccount.json");
const kubeRouterClusterrole = require("../data/kube-router-clusterrole.json");
const kubeRouterClusterrolebinding = require("../data/kube-router-clusterrolebinding.json");
const fs = require("fs");

require("../lib/asGenericAction")({
  options: [
    [
      "-c, --clusterconfig-path [kubeconfig]",
      "Path to the kubeconfig to work with (default ~/.kube/config)"
    ]
  ],
  action: async commander => {
    let client = {};
    let clusterconfig = {};
    if (commander.clusterconfig) {
      const kubeconfig = new KubeConfig();
      kubeconfig.loadFromFile(commander.clusterconfig);
      clusterconfig = fs.readFileSync(commander.clusterconfig, "UTF-8");
      const backend = new Request({ kubeconfig });
      client = new Client({
        backend
      });
    } else {
      client = new Client();
      clusterconfig = fs.readFileSync(
        `${process.env.HOME}/.kube/config`,
        "UTF-8"
      );
    }
    kubeRouterCfg.data.kubeconfig = clusterconfig;
    await client.loadSpec();
    await client.api.v1
      .namespaces("kube-system")
      .configmaps.post({ body: kubeRouterCfg })
      .catch(
        async () =>
          await client.api.v1
            .namespaces("kube-system")
            .configmaps("kube-router-cfg")
            .put({ body: kubeRouterCfg })
      );
    await client.apis.extensions.v1beta1
      .namespaces("kube-system")
      .daemonsets.post({ body: kubeRouterDaemonset })
      .catch(
        async () =>
          await client.apis.extensions.v1beta1
            .namespaces("kube-system")
            .daemonsets("kube-router")
            .put({ body: kubeRouterDaemonset })
      );
    await client.api.v1
      .namespaces("kube-system")
      .serviceaccounts.post({ body: kubeRouterServiceaccount })
      .catch(
        async () =>
          await client.api.v1
            .namespaces("kube-system")
            .serviceaccounts("kube-router")
            .put({ body: kubeRouterServiceaccount })
      );
    await client.apis["rbac.authorization.k8s.io"].v1beta1.clusterroles
      .post({
        body: kubeRouterClusterrole
      })
      .catch(
        async () =>
          await client.apis["rbac.authorization.k8s.io"].v1beta1
            .clusterroles("kube-router")
            .put({
              body: kubeRouterClusterrole
            })
      );
    await client.apis["rbac.authorization.k8s.io"].v1beta1.clusterrolebindings
      .post({
        body: kubeRouterClusterrolebinding
      })
      .catch(
        async () =>
          await client.apis["rbac.authorization.k8s.io"].v1beta1
            .clusterrolebindings("kube-router")
            .put({
              body: kubeRouterClusterrolebinding
            })
      );
    console.log(`Cluster router successfully applied.`);
  }
});
