const shell = require("shelljs");
const fs = require("fs");
const withSCP = require("../withSCP");
const withSSH = require("../withSSH");
const withDownloadedFile = require("../withDownloadedFile");
const writeService = require("../writeService");
const uploadAndStartService = require("../uploadAndStartService");
const stopAndDeleteService = require("../stopAndDeleteService");
const { Client, KubeConfig } = require("kubernetes-client");
const Request = require("kubernetes-client/backends/request");
let kubeProxy = require("../../data/kube-proxy.json");
const kubeRouterCfg = require("../../data/kube-router-cfg.json");
const kubeRouterDaemonset = require("../../data/kube-router-daemonset.json");
const kubeRouterServiceaccount = require("../../data/kube-router-serviceaccount.json");
const kubeRouterClusterrole = require("../../data/kube-router-clusterrole.json");
const kubeRouterClusterrolebinding = require("../../data/kube-router-clusterrolebinding.json");
const longhornNamespace = require("../../data/longhorn-namespace.json");
const longhornClusterrole = require("../../data/longhorn-clusterrole.json");
const longhornClusterrolebinding = require("../../data/longhorn-clusterrolebinding.json");
const longhornCustomresourcedefinitions = require("../../data/longhorn-customresourcedefinitions.json");
const longhornDaemonset = require("../../data/longhorn-daemonset.json");
const longhornService = require("../../data/longhorn-service.json");
const longhornServiceaccount = require("../../data/longhorn-serviceaccount.json");
const longhornDeployment = require("../../data/longhorn-deployment.json");
const longhornStorageclass = require("../../data/longhorn-storageclass.json");
const _ = require("lodash");
const longhornDeleteServiceaccount = require("../../data/longhorn-delete-serviceaccount.json");
const longhornDeleteClusterrole = require("../../data/longhorn-delete-clusterrole.json");
const longhornDeleteClusterrolebinding = require("../../data/longhorn-delete-clusterrolebinding.json");
const longhornDeleteJob = require("../../data/longhorn-delete-job.json");
const withFinishedJob = require("../withFinishedJob");
const withPatches = require("../withPatches");

module.exports = class {
  async downloadBinary({ source, reDownload }) {
    return withDownloadedFile({
      source:
        source || "https://github.com/rancher/k3s/releases/download/v0.8.1/k3s",
      destination: `${shell.tempdir()}/k3s`,
      reDownload: reDownload
    });
  }

  async uploadBinary({ source, target, reUpload }) {
    return new Promise(resolve =>
      withSCP({
        source,
        destination: `${target}:/usr/local/bin/k3s`,
        permissions: "+x",
        reUpload: reUpload === "true"
      }).then(() =>
        withSSH(target, ssh =>
          ssh
            .execCommand(
              `command -v dnf && sudo dnf install -y systemd-resolved iscsi-initiator-utils iptables;
command -v yum && sudo yum install -y systemd-resolved iscsi-initiator-utils iptables;
command -v apt && sudo apt install -y open-iscsi iptables;`
            )
            .then(() => {
              fs.writeFile(
                `${shell.tempdir()}/k3s.conf`,
                `net.bridge.bridge-nf-call-ip6tables = 1
net.bridge.bridge-nf-call-iptables = 1                
`,
                () =>
                  withSCP({
                    source: `${shell.tempdir()}/k3s.conf`,
                    destination: `${target}:/etc/sysctl.d/k3s.conf`,
                    permissions: "+rwx",
                    reUpload: reUpload === "true"
                  }).then(() =>
                    ssh
                      .execCommand(
                        `sudo sysctl --system;
sudo modprobe br_netfilter;
sudo systemctl enable --now systemd-resolved;
sudo systemctl restart systemd-resolved;
command -v dnf && sudo dnf install -y policycoreutils policycoreutils-python selinux-policy selinux-policy-targeted libselinux-utils setroubleshoot-server setools-console mcstrans;
command -v yum && sudo yum install -y policycoreutils policycoreutils-python selinux-policy selinux-policy-targeted libselinux-utils setroubleshoot-server setools-console mcstrans;
command -v apt && sudo apt install -y policycoreutils policycoreutils-python-utils selinux-basics selinux-policy-default auditd;
command -v apt && sudo selinux-activate;
command -v setenforce && sudo setenforce Permissive;
sudo systemctl disable firewalld --now;
command -v ufw && sudo ufw allow 6443;
sudo semanage fcontext -a -t bin_t /usr/local/bin/k3s; sudo restorecon -v /usr/local/bin/k3s;
mkdir -p /opt/cni/bin; ln -s /var/lib/rancher/k3s/data/*/bin/* /opt/cni/bin;
mkdir -p /opt/cni/bin; ln -s /var/lib/rancher/k3s/data/*/bin/* /opt/cni/bin;`
                      )
                      .then(() => {
                        ssh.dispose();
                        resolve(target);
                      })
                  )
              );
            })
        )
      )
    );
  }

  async deleteBinary(target) {
    return new Promise(resolve =>
      withSSH(target, ssh =>
        ssh.execCommand("sudo rm -f /usr/local/bin/k3s").then(() => {
          ssh.dispose();
          resolve(target);
        })
      )
    );
  }

  async writeManager(additionalIp) {
    return writeService({
      name: "k3s-manager.service",
      content: `[Unit]
Description=k3s kubernetes daemon (manager only)
After=network.target

[Service]
ExecStart=/usr/local/bin/k3s server --flannel-iface wgoverlay${additionalIp &&
        " --tls-san " + additionalIp} --disable-agent

[Install]
WantedBy=multi-user.target
`
    });
  }

  async uploadManager(args) {
    return uploadAndStartService({
      name: "k3s-manager.service",
      patchFunction: ssh => withPatches({ manager: true, ssh }),
      ...args
    });
  }

  async deleteManager(target) {
    return stopAndDeleteService({ target, name: "k3s-manager.service" });
  }

  async writeHybrid(additionalIp) {
    return writeService({
      name: "k3s-hybrid.service",
      content: `[Unit]
Description=k3s kubernetes daemon (manager and worker)
After=network.target

[Service]
ExecStart=/usr/local/bin/k3s server --flannel-iface wgoverlay${additionalIp &&
        " --tls-san " + additionalIp}

[Install]
WantedBy=multi-user.target
`
    });
  }

  async uploadHybrid(args) {
    return uploadAndStartService({
      name: "k3s-hybrid.service",
      patchFunction: ssh => withPatches({ manager: true, ssh }),
      ...args
    });
  }

  async deleteHybrid(target) {
    return stopAndDeleteService({ target, name: "k3s-hybrid.service" });
  }

  async writeWorker({ clusterToken, manager }) {
    return writeService({
      name: "k3s-worker.service",
      content: `[Unit]
Description=k3s kubernetes daemon (worker only)
After=network.target

[Service]
ExecStart=/usr/local/bin/k3s agent --flannel-iface wgoverlay --token ${clusterToken} --server https://${manager}:6443

[Install]
WantedBy=multi-user.target
`
    });
  }

  async uploadWorker(args) {
    return uploadAndStartService({
      name: "k3s-worker.service",
      patchFunction: ssh => withPatches({ manager: false, ssh }),
      ...args
    });
  }

  async deleteWorker(target) {
    return stopAndDeleteService({ target, name: "k3s-worker.service" });
  }

  async applyRouter(providedClusterconfig) {
    return new Promise(async resolve => {
      let client = {};
      let clusterconfig = {};
      if (providedClusterconfig) {
        const kubeconfig = new KubeConfig();
        kubeconfig.loadFromFile(providedClusterconfig);
        clusterconfig = fs.readFileSync(providedClusterconfig, "UTF-8");
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
      kubeProxy.data["kubeconfig.conf"] = clusterconfig;
      await client.loadSpec();
      await client.api.v1
        .namespaces("kube-system")
        .configmaps.post({ body: kubeProxy })
        .catch(
          async () =>
            await client.api.v1
              .namespaces("kube-system")
              .configmaps("kube-proxy")
              .put({ body: kubeProxy })
        );
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
      await resolve(true);
    });
  }

  async deleteRouter(clusterconfig) {
    return new Promise(async resolve => {
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
      for (let pod of (await client.api.v1
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
      await resolve(true);
    });
  }

  async applyStorage(clusterconfig) {
    return new Promise(async resolve => {
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
      await resolve(true);
    });
  }

  async deleteStorage(clusterconfig) {
    return new Promise(async resolve => {
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
      await client.apis["storage.k8s.io"].v1
        .storageclasses("longhorn")
        .delete();
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
        await resolve(true);
      });
    });
  }

  async getConfig(target) {
    return new Promise(resolve =>
      withSSH(target, ssh =>
        ssh.execCommand(`cat /etc/rancher/k3s/k3s.yaml`).then(result => {
          ssh.dispose();
          resolve(
            result.stdout &&
              result.stdout.replace("localhost", target.split("@")[1])
          );
        })
      )
    );
  }

  async deleteConfig(target) {
    return new Promise(resolve =>
      withSSH(target, ssh =>
        ssh
          .execCommand(
            "sudo rm -rf /etc/rancher; ip link del kube-bridge; ip link del dummy0; ip link del kube-dummy-if"
          )
          .then(() => {
            ssh.dispose();
            resolve(target);
          })
      )
    );
  }

  async deleteData(target) {
    return new Promise(resolve =>
      withSSH(target, ssh =>
        ssh
          .execCommand(
            "sudo umount /var/lib/rancher/k3s/agent/kubelet/pods/*/volumes/kubernetes.io~secret/*; sudo rm -rf /var/lib/rancher; sudo rm -rf ${HOME}/.rancher; sudo rm -rf /var/lib/cni; sudo rm -rf /opt/cni; sudo rm -rf /var/lib/kube-router"
          )
          .then(() => {
            ssh.dispose();
            resolve(target);
          })
      )
    );
  }

  async getToken(target) {
    return new Promise(resolve =>
      withSSH(target, ssh =>
        ssh
          .execCommand(`cat /var/lib/rancher/k3s/server/node-token`)
          .then(result => {
            ssh.dispose();
            resolve(result.stdout);
          })
      )
    );
  }

  async getNodes({ clusterconfig, name }) {
    return new Promise(async resolve => {
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
  }
};
