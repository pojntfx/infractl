#!/usr/bin/env node

const { Client, KubeConfig } = require("kubernetes-client");
const Request = require("kubernetes-client/backends/request");
const longhornDeleteServiceaccount = require("../data/longhorn-delete-serviceaccount.json");
const longhornDeleteClusterrole = require("../data/longhorn-delete-clusterrole.json");
const longhornDeleteClusterrolebinding = require("../data/longhorn-delete-clusterrolebinding.json");
const longhornDeleteJob = require("../data/longhorn-delete-job.json");
const withFinishedJob = require("../lib/withFinishedJob");
const longhornCustomresourcedefinitions = require("../data/longhorn-customresourcedefinitions.json");

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
    await client.apis["storage.k8s.io"].v1.storageclasses("longhorn").delete();
    await client.api.v1
      .namespaces("default")
      .serviceaccounts.post({ body: longhornDeleteServiceaccount })
      .catch(
        async () =>
          await client.api.v1
            .namespaces("default")
            .serviceaccounts("longhorn-uninstall-service-account")
            .put({ body: longhornDeleteServiceaccount })
      );
    await client.apis["rbac.authorization.k8s.io"].v1beta1.clusterroles
      .post({
        body: longhornDeleteClusterrole
      })
      .catch(
        async () =>
          await client.apis["rbac.authorization.k8s.io"].v1beta1
            .clusterroles("longhorn-uninstall-role")
            .put({
              body: longhornDeleteClusterrole
            })
      );
    await client.apis["rbac.authorization.k8s.io"].v1beta1.clusterrolebindings
      .post({
        body: longhornDeleteClusterrolebinding
      })
      .catch(
        async () =>
          await client.apis["rbac.authorization.k8s.io"].v1beta1
            .clusterrolebindings("longhorn-uninstall-bind")
            .put({
              body: longhornDeleteClusterrolebinding
            })
      );
    await client.apis.batch.v1
      .namespaces("default")
      .job.post({
        body: longhornDeleteJob
      })
      .catch(
        async () =>
          await client.apis.batch.v1
            .namespaces("default")
            .job("longhorn-uninstall")
            .put({
              body: longhornDeleteJob
            })
      );
    await withFinishedJob(client, async () => {
      await client.apis.batch.v1
        .namespaces("default")
        .job("longhorn-uninstall")
        .delete();
      for (let definition of longhornCustomresourcedefinitions) {
        await client.apis["apiextensions.k8s.io"].v1beta1
          .customresourcedefinitions(definition.metadata.name)
          .delete();
      }
      await client.apis["rbac.authorization.k8s.io"].v1beta1
        .clusterrolebindings("longhorn-bind")
        .delete();
      await client.apis["rbac.authorization.k8s.io"].v1beta1
        .clusterroles("longhorn-role")
        .delete();
      await client.api.v1.namespaces("longhorn-system").delete();
      await client.api.v1
        .namespaces("default")
        .serviceaccounts("longhorn-uninstall-service-account")
        .delete();
      await client.apis["rbac.authorization.k8s.io"].v1beta1
        .clusterrolebindings("longhorn-uninstall-bind")
        .delete();
      await client.apis["rbac.authorization.k8s.io"].v1beta1
        .clusterroles("longhorn-uninstall-role")
        .delete();
      console.log(`Cluster storage successfully deleted.`);
    });
  }
});
