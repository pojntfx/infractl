#!/usr/bin/env node

const withSSH = require("../lib/withSSH");

require("../lib/asGenericAction")({
  args: "<user@ip> [otherTargets...]",
  action: commander =>
    commander.args.map(target =>
      withSSH(target, ssh =>
        ssh
          .execCommand(
            "umount /var/lib/rancher/k3s/agent/kubelet/pods/*/volumes/kubernetes.io~secret/*; rm -rf /var/lib/rancher; rm -rf ${HOME}/.rancher; rm -rf /var/lib/cni; rm -rf /opt/cni; rm -rf /var/lib/kube-router"
          )
          .then(() =>
            ssh
              .execCommand(
                "ip link del kube-bridge; ip link del dummy0; ip link del kube-dummy-if"
              )
              .then(() => {
                ssh.dispose();
                console.log(`Cluster data successfully deleted on ${target}.`);
              })
          )
      )
    )
});
