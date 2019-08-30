const withSSH = require("./withSSH");
const withRsync = require("./withRsync");

module.exports = async ({ name, source, target, reUpload }) =>
  new Promise(resolve =>
    withRsync({
      source,
      destination: `${target}:/etc/systemd/system/${name}`,
      permissions: "+rwx",
      reUpload: reUpload === "true"
    }).then(() =>
      withSSH(target, ssh =>
        ssh
          .execCommand(
            `systemctl daemon-reload;
systemctl enable ${name} --now;`
          )
          .then(() => {
            ssh.dispose();
            resolve(target);
          })
      )
    )
  );
