const Rsync = require("rsync");
const withSSH = require("./withSSH");

module.exports = async ({ source, destination, permissions, reUpload }) => {
  withSSH(destination.split(":")[0], ssh =>
    ssh
      .execCommand(
        `command -v dnf && sudo dnf install -y rsync;
command -v yum && sudo yum install -y rsync;
command -v apt && sudo apt install -y rsync;`
      )
      .then(() => {
        ssh.dispose();
        const rsync = new Rsync();
        rsync
          .shell("ssh")
          .set(reUpload ? "ignore-times" : undefined)
          .chmod(permissions)
          .source(source)
          .destination(destination);
        return rsync.execute();
      })
  );
};
