#!/usr/bin/env node

const shell = require("shelljs");
const fs = require("fs");
const withRsync = require("../lib/withRsync");
const withSSH = require("../lib/withSSH");
const withDownloadedFile = require("../lib/withDownloadedFile");

require("../lib/asGenericAction")({
  args: "<user@ip> [otherTargets...]",
  options: [
    [
      "-s, --source [source]",
      "Cluster binary's source (default https://github.com/rancher/k3s/releases/download/v0.8.1/k3s)"
    ],
    [
      "-d, --re-download [true|false]",
      "Whether the binary should be downloaded again if it already exists locally (default false)"
    ],
    [
      "-u, --re-upload [true|false]",
      "Whether the binary should be uploaded again if it already exists on the target (default false)"
    ]
  ],
  action: async commander =>
    withDownloadedFile({
      source:
        commander.source ||
        "https://github.com/rancher/k3s/releases/download/v0.8.1/k3s",
      destination: `${shell.tempdir()}/k3s`,
      reDownload: commander.reDownload
    }).then(destination => {
      commander.args.map(target => {
        withRsync({
          source: destination,
          destination: `${target}:/usr/local/bin/k3s`,
          permissions: "+x",
          reUpload: commander.reUpload === "true"
        }).then(() => {
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
                      reUpload: commander.reUpload === "true"
                    }).then(() =>
                      ssh
                        .execCommand(
                          `sysctl --system;
sudo modprobe br_netfilter;
sudo systemctl enable --now systemd-resolved;
sudo systemctl restart systemd-resolved;
command -v dnf && sudo dnf install -y policycoreutils-python-utils;
command -v yum && sudo yum install -y policycoreutils-python;
command -v apt && sudo apt install -y policycoreutils-python-utils;
systemctl disable firewalld --now;
command -v ufw && sudo ufw allow 6443;
sudo semanage fcontext -a -t bin_t /usr/local/bin/k3s; restorecon -v /usr/local/bin/k3s;
mkdir -p /opt/cni/bin; ln -s /var/lib/rancher/k3s/data/*/bin/* /opt/cni/bin;
mkdir -p /opt/cni/bin; ln -s /var/lib/rancher/k3s/data/*/bin/* /opt/cni/bin;`
                        )
                        .then(() => {
                          ssh.dispose();
                          console.log(
                            `Cluster binary successfully applied to ${target}.`
                          );
                        })
                    )
                );
              })
          );
        });
      });
    })
});
