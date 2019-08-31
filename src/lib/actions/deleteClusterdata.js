const withSSH = require("../withSSH");

module.exports = async target =>
  new Promise(resolve =>
    withSSH(target, ssh =>
      ssh
        .execCommand(
          "umount /var/lib/rancher/k3s/agent/kubelet/pods/*/volumes/kubernetes.io~secret/*; rm -rf /var/lib/rancher; rm -rf ${HOME}/.rancher; rm -rf /var/lib/cni; rm -rf /opt/cni; rm -rf /var/lib/kube-router"
        )
        .then(() => {
          ssh.dispose();
          resolve(target);
        })
    )
  );
