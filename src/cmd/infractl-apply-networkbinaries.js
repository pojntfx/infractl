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
      "Network binary's source (default https://github.com/costela/wesher/releases/download/v0.2.3/wesher-amd64)"
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
        "https://github.com/costela/wesher/releases/download/v0.2.3/wesher-amd64",
      destination: `${shell.tempdir()}/wesher`,
      reDownload: commander.reDownload
    }).then(destination => {
      commander.args.map(target => {
        withRsync({
          source: destination,
          destination: `${target}:/usr/local/bin/wesher`,
          permissions: "+x",
          reUpload: commander.reUpload === "true"
        }).then(() => {
          withSSH(target, ssh =>
            ssh
              .execCommand(
                `command -v apt && echo "deb http://deb.debian.org/debian/ unstable main" > /etc/apt/sources.list.d/unstable.list;
command -v apt && printf 'Package: *\nPin: release a=unstable\nPin-Priority: 90\n' > /etc/apt/preferences.d/limit-unstable;
command -v apt && sudo apt update;
command -v apt && sudo apt install -y wireguard-dkms linux-headers-$(uname -r);`
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
                      reUpload: commander.reUpload === "true"
                    }).then(() =>
                      ssh
                        .execCommand(
                          `sysctl --system;
modprobe wireguard;`
                        )
                        .then(() => {
                          ssh.dispose();
                          console.log(
                            `Network binary successfully applied to ${target}.`
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
