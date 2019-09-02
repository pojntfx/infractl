const shell = require("shelljs");
const fs = require("fs");
const withSCP = require("../withSCP");
const withSSH = require("../withSSH");
const withDownloadedFile = require("../withDownloadedFile");
const crypto = require("crypto");
const writeService = require("../writeService");
const uploadAndStartService = require("../uploadAndStartService");
const stopAndDeleteService = require("../stopAndDeleteService");
const YAML = require("yaml");

module.exports = class {
  async downloadBinary({ source, reDownload }) {
    return withDownloadedFile({
      source:
        source ||
        "https://github.com/costela/wesher/releases/download/v0.2.3/wesher-amd64",
      destination: `${shell.tempdir()}/wesher`,
      reDownload: reDownload
    });
  }
  async uploadBinary({ source, target, reUpload }) {
    return new Promise(resolve =>
      withSCP({
        source: source,
        destination: `${target}:/usr/local/bin/wesher`,
        permissions: "+x",
        reUpload: reUpload === "true"
      }).then(() =>
        withSSH(target, ssh =>
          ssh
            .execCommand(
              `distro="$(awk -F= '/^NAME/{print $2}' /etc/os-release)";
echo $distro | grep Debian && echo "deb http://deb.debian.org/debian/ unstable main" > /etc/apt/sources.list.d/unstable.list;
echo $distro | grep Debian && printf 'Package: *\nPin: release a=unstable\nPin-Priority: 90\n' > /etc/apt/preferences.d/limit-unstable;
echo $distro | grep Ubuntu && sudo add-apt-repository -y ppa:wireguard/wireguard;
command -v apt && sudo apt update;
command -v apt && sudo apt install -y wireguard-dkms linux-headers-$(uname -r);
command -v dnf && sudo dnf copr enable -y jdoss/wireguard;
command -v dnf && sudo dnf install -y wireguard-dkms kernel-devel-$(uname -r) kernel-headers-$(uname -r);
command -v yum && yum update -y;
command -v yum && sudo curl -Lo /etc/yum.repos.d/wireguard.repo https://copr.fedorainfracloud.org/coprs/jdoss/wireguard/repo/epel-7/jdoss-wireguard-epel-7.repo;
command -v yum && sudo yum install -y epel-release;
command -v yum && sudo yum install -y wireguard-dkms kernel-devel-$(uname -r) kernel-headers-$(uname -r);`
            )
            .then(() => {
              fs.writeFile(
                `${shell.tempdir()}/wesher.conf`,
                `net.ipv4.ip_forward = 1
net.ipv4.conf.all.proxy_arp = 1
`,
                () =>
                  withSCP({
                    source: `${shell.tempdir()}/wesher.conf`,
                    destination: `${target}:/etc/sysctl.d/wesher.conf`,
                    permissions: "+rwx",
                    reUpload: reUpload === "true"
                  }).then(() =>
                    ssh
                      .execCommand(
                        `sysctl --system;
modprobe wireguard;
systemctl disable firewalld --now;
command -v ufw && sudo ufw allow 51820;
command -v ufw && sudo ufw allow 7946;`
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
        ssh.execCommand("sudo rm -f /usr/local/bin/wesher").then(() => {
          ssh.dispose();
          resolve(target);
        })
      )
    );
  }

  async writeManager() {
    return writeService({
      name: "wesher-manager.service",
      content: `[Unit]
Description=wesher overlay network daemon (manager and worker)
After=network.target

[Service]
ExecStart=/usr/local/bin/wesher --cluster-key ${crypto
        .randomBytes(32)
        .toString("base64")}

[Install]
WantedBy=multi-user.target
`
    });
  }

  async uploadManager(args) {
    return uploadAndStartService({
      name: "wesher-manager.service",
      ...args
    });
  }

  async deleteManager(target) {
    return stopAndDeleteService({ target, name: "wesher-manager.service" });
  }

  async writeWorker({ networkToken, manager }) {
    return writeService({
      name: "wesher-worker.service",
      content: `[Unit]
Description=wesher overlay network daemon (worker only)
After=network.target

[Service]
ExecStart=/usr/local/bin/wesher --cluster-key ${networkToken} --join ${manager}

[Install]
WantedBy=multi-user.target
`
    });
  }

  async uploadWorker(args) {
    return uploadAndStartService({
      name: "wesher-worker.service",
      ...args
    });
  }

  async deleteWorker(target) {
    return stopAndDeleteService({ target, name: "wesher-worker.service" });
  }

  async getToken(target) {
    return new Promise(resolve =>
      withSSH(target, ssh =>
        ssh
          .execCommand(`cat /etc/systemd/system/wesher-manager.service`)
          .then(result => {
            ssh.dispose();
            resolve(
              result.stdout &&
                result.stdout
                  .split("--cluster-key")[1]
                  .split("\n")[0]
                  .replace(" ", "")
            );
          })
      )
    );
  }

  async getNode({ target, node }) {
    return new Promise(resolve =>
      withSSH(node, ssh =>
        ssh.execCommand(`cat /var/lib/wesher/state.json`).then(async result => {
          if (result.stdout) {
            const nodes = JSON.parse(result.stdout).Nodes;
            if (target) {
              ssh.dispose();
              resolve({
                list: false,
                data: YAML.stringify(
                  nodes.find(node => node.PubKey === target),
                  null,
                  4
                )
              });
            } else {
              const nodesWithOnlineStatus = [];
              await Promise.all(
                nodes.map(node =>
                  ssh
                    .execCommand(`ping -c 1 ${node.OverlayAddr.IP}`)
                    .then(
                      res =>
                        (res.stdout.includes("1 received") &&
                          nodesWithOnlineStatus.push([
                            node.PubKey,
                            node.Name,
                            true,
                            node.OverlayAddr.IP
                          ])) ||
                        nodesWithOnlineStatus.push([
                          node.PubKey,
                          node.Name,
                          false,
                          node.OverlayAddr.IP
                        ])
                    )
                )
              );
              await ssh.execCommand(`ip a`).then(res =>
                ssh.execCommand(`hostname`).then(res2 =>
                  nodesWithOnlineStatus.unshift([
                    "NOT AVAILABLE (YOU ARE QUERYING VIA THIS NODE)",
                    res2.stdout,
                    true,
                    res.stdout
                      .split("wgoverlay")[1]
                      .split("inet")[1]
                      .split("/32")[0]
                      .replace(" ", "")
                  ])
                )
              );
              ssh.dispose();
              resolve({ list: true, data: nodesWithOnlineStatus });
            }
          }
        })
      )
    );
  }

  async deleteData(target) {
    return new Promise(resolve =>
      withSSH(target, ssh =>
        ssh.execCommand("rm -rf /var/lib/wesher").then(() => {
          ssh.dispose();
          resolve(target);
        })
      )
    );
  }
};
