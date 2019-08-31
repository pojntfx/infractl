const { Client, KubeConfig } = require("kubernetes-client");
const Request = require("kubernetes-client/backends/request");

module.exports = async ({ clusterconfig, name }) =>
  new Promise(async resolve => {
    let client = {};
    if (clusterconfig) {
      const kubeconfig = new KubeConfig();
      kubeconfig.loadFromFile(clusterconfig);
      const backend = new Request({ kubeconfig });
      client = new Client({
        backend
      });
    } else {
      client = new Client();
    }
    await client.loadSpec();
    if (name) {
      client.api.v1
        .nodes(name)
        .get()
        .then(res =>
          resolve({
            list: false,
            data: res.body
          })
        );
    } else {
      client.api.v1.nodes
        .get()
        .then(res => resolve({ list: true, data: res.body.items }));
    }
  });
