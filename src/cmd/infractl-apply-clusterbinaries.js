#!/usr/bin/env node

const shell = require("shelljs");
const download = require("download");
const fs = require("fs");
const withRsync = require("../lib/withRsync");
const withSSH = require("../lib/withSSH");

require("../lib/asGenericAction")({
  args: "<user@ip> [otherTargets...]",
  options: [
    [
      "-s, --source [source]",
      "Network binary's source (default https://github.com/rancher/k3s/releases/download/v0.8.1/k3s)"
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
  action: async commander => {
    const downloadAndExtract = () =>
      download(
        commander.source ||
          "https://github.com/rancher/k3s/releases/download/v0.8.1/k3s"
      ).then(data => {
        fs.writeFileSync(`${shell.tempdir()}/k3s`, data);
      });
    commander.reDownload === "true"
      ? await downloadAndExtract()
      : !commander.reDownload &&
        (!fs.existsSync(`${shell.tempdir()}/k3s`) &&
          (await downloadAndExtract()));
    commander.args.map(target => {
      withRsync({
        source: `${shell.tempdir()}/k3s`,
        destination: `${target}:/usr/local/bin/k3s`,
        permissions: "+x",
        reUpload: commander.reUpload === "true"
      }).then(() => {
        withSSH(target, ssh =>
          ssh
            .execCommand(
              "command -v dnf && sudo dnf install -y systemd-resolved iscsi-initiator-utils; command -v yum && sudo yum install -y systemd-resolved iscsi-initiator-utils; command -v apt && sudo apt install -y open-iscsi"
            )
            .then(() => {
              fs.writeFile(
                `${shell.tempdir()}/k8s.conf`,
                `net.bridge.bridge-nf-call-ip6tables = 1
net.bridge.bridge-nf-call-iptables = 1                
              `,
                () =>
                  withRsync({
                    source: `${shell.tempdir()}/k8s.conf`,
                    destination: `${target}:/etc/sysctl.d/k8s.conf`,
                    permissions: "+rwx",
                    reUpload: commander.reUpload === "true"
                  }).then(() =>
                    ssh
                      .execCommand(
                        "sysctl --system; modprobe br_netfilter; systemctl enable --now systemd-resolved; systemctl restart systemd-resolved"
                      )
                      .then(() =>
                        ssh
                          .execCommand(
                            "command -v dnf && sudo dnf install -y policycoreutils-python-utils; command -v yum && sudo yum install -y policycoreutils-python; command -v apt && sudo apt install -y policycoreutils-python-utils"
                          )
                          .then(() =>
                            ssh
                              .execCommand(
                                "semanage fcontext -a -t bin_t /usr/local/bin/k3s; restorecon -v /usr/local/bin/k3s"
                              )
                              .then(() =>
                                ssh
                                  .execCommand(
                                    "mkdir -p /opt/cni/bin; ln -s /var/lib/rancher/k3s/data/*/bin/* /opt/cni/bin"
                                  )
                                  .then(() => {
                                    ssh.dispose();
                                    console.log(
                                      `Cluster binary successfully applied to ${target}.`
                                    );
                                  })
                              )
                          )
                      )
                  )
              );
            })
        );
      });
    });
  }
});
