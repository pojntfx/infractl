const Rsync = require("rsync");
const withSSH = require("./withSSH");
const shell = require("shelljs");
module.exports = async ({ source, destination, permissions, reUpload }) => {
  const target = destination.split(":")[0];
  const targetPath = destination.split(":")[1];
  return new Promise(resolve =>
    withSSH(target, ssh =>
      ssh
        .execCommand(
          `command -v dnf && sudo dnf install -y rsync;
command -v yum && sudo yum install -y rsync;
command -v apt && sudo apt install -y rsync;`
        )
        .then(() => {
          ssh.dispose();
          const rsync = new Rsync();
          if (ssh.isLocal) {
            shell.cp(source, targetPath);
            permissions && shell.chmod(permissions, targetPath);
            resolve(true);
          } else {
            rsync
              .shell("ssh")
              .set(reUpload ? "ignore-times" : undefined)
              .chmod(permissions)
              .source(source)
              .destination(destination);
            rsync.execute(() => resolve(true));
          }
        })
    )
  );
};
