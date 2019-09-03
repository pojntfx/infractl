const withSSH = require("./withSSH");
const withSCP = require("./withSCP");

module.exports = async ({ name, source, target, reUpload, patchFunction }) =>
  new Promise(resolve =>
    withSCP({
      source,
      destination: `${target}:/etc/systemd/system/${name}`,
      permissions: "+rwx",
      reUpload: reUpload === "true"
    }).then(() =>
      withSSH(target, ssh =>
        ssh
          .execCommand(
            `sudo systemctl daemon-reload;
sudo systemctl enable ${name} --now;`
          )
          .then(async () => {
            patchFunction && (await patchFunction(ssh));
            ssh.dispose();
            resolve(target);
          })
      )
    )
  );
