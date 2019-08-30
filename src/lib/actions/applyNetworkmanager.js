const shell = require("shelljs");
const fs = require("fs");
const withSSH = require("../withSSH");
const withRsync = require("../withRsync");
const crypto = require("crypto");

const writeNetworkmanager = async () =>
  new Promise(resolve =>
    fs.writeFile(
      `${shell.tempdir()}/wesher-manager.service`,
      `[Unit]
    Description=wesher overlay network daemon (manager and worker)
    After=network.target
    
    [Service]
    ExecStart=/usr/local/bin/wesher --cluster-key ${crypto
      .randomBytes(32)
      .toString("base64")}
    
    [Install]
    WantedBy=multi-user.target
    `,
      () => resolve(`${shell.tempdir()}/wesher-manager.service`)
    )
  );

const uploadNetworkmanager = async ({ source, target, reUpload }) =>
  new Promise(resolve =>
    withRsync({
      source,
      destination: `${target}:/etc/systemd/system/wesher-manager.service`,
      permissions: "+rwx",
      reUpload: reUpload === "true"
    }).then(() =>
      withSSH(target, ssh =>
        ssh
          .execCommand(
            `systemctl daemon-reload;
    systemctl enable wesher-manager.service --now;`
          )
          .then(() => {
            ssh.dispose();
            resolve(target);
          })
      )
    )
  );

module.exports = { writeNetworkmanager, uploadNetworkmanager };
