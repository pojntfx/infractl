const shell = require("shelljs");
const fs = require("fs");
const withRsync = require("../withRsync");
const withSSH = require("../withSSH");
const withDownloadedFile = require("../withDownloadedFile");

const downloadNetworkbinary = async ({ source, reDownload }) =>
  withDownloadedFile({
    source:
      source ||
      "https://github.com/costela/wesher/releases/download/v0.2.3/wesher-amd64",
    destination: `${shell.tempdir()}/wesher`,
    reDownload: reDownload
  });

const uploadNetworkbinary = async ({ source, target, reUpload }) =>
  new Promise(resolve =>
    withRsync({
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
                withRsync({
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

module.exports = {
  downloadNetworkbinary,
  uploadNetworkbinary
};
