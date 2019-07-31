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
      "Network binary's source (default http://download.zerotier.com/dist/debian/buster/pool/main/z/zerotier-one/zerotier-one_1.2.12_amd64.deb)"
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
          "http://download.zerotier.com/dist/debian/buster/pool/main/z/zerotier-one/zerotier-one_1.2.12_amd64.deb"
      ).then(data => {
        fs.writeFileSync(`${shell.tempdir()}/zerotier-one.deb`, data);
        shell.exec(
          `ar -p ${shell.tempdir()}/zerotier-one.deb data.tar.xz | tar -xJf - ./usr/sbin/zerotier-one --to-stdout >${shell.tempdir()}/zerotier-one`
        );
      });
    commander.reDownload === "true"
      ? await downloadAndExtract()
      : !commander.reDownload &&
        (!fs.existsSync(`${shell.tempdir()}/zerotier-one`) &&
          (await downloadAndExtract()));
    commander.args.map(target => {
      withSSH(target, ssh =>
        ssh
          .execCommand(
            "command -v dnf && sudo dnf install -y rsync; command -v yum && sudo yum install -y rsync; command -v apt && sudo apt install -y rsync"
          )
          .then(() =>
            withRsync({
              source: `${shell.tempdir()}/zerotier-one`,
              destination: `${target}:/usr/local/bin/zerotier-one`,
              permissions: "+x",
              reUpload: commander.reUpload === "true"
            }).then(() => {
              ssh.dispose();
              console.log(`Network binary successfully applied to ${target}.`);
            })
          )
      );
    });
  }
});
