const shell = require("shelljs");
const fs = require("fs");
const withRsync = require("../withRsync");
const withSSH = require("../withSSH");
const withDownloadedFile = require("../withDownloadedFile");

const downloadClusterbinary = async ({ source, reDownload }) =>
  withDownloadedFile({
    source:
      source || "https://github.com/rancher/k3s/releases/download/v0.8.1/k3s",
    destination: `${shell.tempdir()}/k3s`,
    reDownload: reDownload
  });

const uploadClusterbinary = async ({ source, target, reUpload }) =>
  new Promise(resolve =>
    withRsync({
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
                withRsync({
                  source: `${shell.tempdir()}/k3s.conf`,
                  destination: `${target}:/etc/sysctl.d/k3s.conf`,
                  permissions: "+rwx",
                  reUpload: reUpload === "true"
                }).then(() =>
                  ssh
                    .execCommand(
                      `sysctl --system;
sudo modprobe br_netfilter;
sudo systemctl enable --now systemd-resolved;
sudo systemctl restart systemd-resolved;
command -v dnf && sudo dnf install -y policycoreutils policycoreutils-python selinux-policy selinux-policy-targeted libselinux-utils setroubleshoot-server setools-console mcstrans;
command -v yum && sudo yum install -y policycoreutils policycoreutils-python selinux-policy selinux-policy-targeted libselinux-utils setroubleshoot-server setools-console mcstrans;
command -v apt && sudo apt install -y policycoreutils policycoreutils-python-utils selinux-basics selinux-policy-default auditd;
command -v apt && sudo selinux-activate;
command -v setenforce && sudo setenforce Permissive;
systemctl disable firewalld --now;
command -v ufw && sudo ufw allow 6443;
sudo semanage fcontext -a -t bin_t /usr/local/bin/k3s; restorecon -v /usr/local/bin/k3s;
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

module.exports = {
  downloadClusterbinary,
  uploadClusterbinary
};
