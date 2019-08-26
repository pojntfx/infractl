#!/usr/bin/env node

const { Client, KubeConfig } = require("kubernetes-client");
const Request = require("kubernetes-client/backends/request");
const longhornNamespace = require("../data/longhorn-namespace.json");
const longhornClusterrole = require("../data/longhorn-clusterrole.json");
const longhornClusterrolebinding = require("../data/longhorn-clusterrolebinding.json");
const longhornCustomresourcedefinitions = require("../data/longhorn-customresourcedefinitions.json");
const longhornDaemonset = require("../data/longhorn-daemonset.json");
const longhornService = require("../data/longhorn-service.json");
const longhornServiceaccount = require("../data/longhorn-serviceaccount.json");
const longhornDeployment = require("../data/longhorn-deployment.json");
const longhornStorageclass = require("../data/longhorn-storageclass.json");
const _ = require("lodash");

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
    await client.api.v1.namespaces
      .post({ body: longhornNamespace })
      .catch(
        async () =>
          await client.api.v1
            .namespaces("longhorn-system")
            .put({ body: longhornNamespace })
      );
    await client.apis["rbac.authorization.k8s.io"].v1beta1.clusterroles
      .post({
        body: longhornClusterrole
      })
      .catch(
        async () =>
          await client.apis["rbac.authorization.k8s.io"].v1beta1
            .clusterroles("longhorn-role")
            .put({
              body: longhornClusterrole
            })
      );
    await client.apis["rbac.authorization.k8s.io"].v1beta1.clusterrolebindings
      .post({
        body: longhornClusterrolebinding
      })
      .catch(
        async () =>
          await client.apis["rbac.authorization.k8s.io"].v1beta1
            .clusterrolebindings("longhorn-bind")
            .put({
              body: longhornClusterrolebinding
            })
      );
    for (let definition of longhornCustomresourcedefinitions) {
      await client.apis[
        "apiextensions.k8s.io"
      ].v1beta1.customresourcedefinitions
        .post({
          body: definition
        })
        .catch(
          async () =>
            await client.apis["apiextensions.k8s.io"].v1beta1
              .customresourcedefinitions(definition.metadata.name)
              .put({
                body: _.merge(definition, {
                  metadata: {
                    resourceVersion: (await client.apis[
                      "apiextensions.k8s.io"
                    ].v1beta1
                      .customresourcedefinitions(definition.metadata.name)
                      .get()).body.metadata.resourceVersion
                  }
                })
              })
        );
      await client.addCustomResourceDefinition(definition);
    }
    await client.apis.apps.v1beta2
      .namespaces("longhorn-system")
      .daemonsets.post({ body: longhornDaemonset })
      .catch(
        async () =>
          await client.apis.apps.v1beta2
            .namespaces("longhorn-system")
            .daemonsets("longhorn-manager")
            .put({ body: longhornDaemonset })
      );
    await client.api.v1
      .namespaces("longhorn-system")
      .services.post({ body: longhornService })
      .catch(
        async () =>
          await client.api.v1
            .namespaces("longhorn-system")
            .services("longhorn-backend")
            .put({
              body: _.merge(longhornService, {
                metadata: {
                  resourceVersion: (await client.api.v1
                    .namespaces("longhorn-system")
                    .services("longhorn-backend")
                    .get()).body.metadata.resourceVersion
                },
                spec: {
                  clusterIP: (await client.api.v1
                    .namespaces("longhorn-system")
                    .services("longhorn-backend")
                    .get()).body.spec.clusterIP
                }
              })
            })
      );
    await client.api.v1
      .namespaces("longhorn-system")
      .serviceaccounts.post({ body: longhornServiceaccount })
      .catch(
        async () =>
          await client.api.v1
            .namespaces("longhorn-system")
            .serviceaccounts("longhorn-service-account")
            .put({ body: longhornServiceaccount })
      );
    await client.apis.apps.v1beta2
      .namespaces("longhorn-system")
      .deployments.post({ body: longhornDeployment })
      .catch(
        async () =>
          await client.apis.apps.v1beta2
            .namespaces("longhorn-system")
            .deployments("longhorn-driver-deployer")
            .put({ body: longhornDeployment })
      );
    await client.apis["storage.k8s.io"].v1.storageclasses
      .post({
        body: longhornStorageclass
      })
      .catch(
        async () =>
          await client.apis["storage.k8s.io"].v1
            .storageclasses("longhorn")
            .put({
              body: longhornStorageclass
            })
      );
    console.log(`Cluster storage successfully applied.`);
  }
});
