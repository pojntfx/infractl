const withSSH = require("./withSSH");
const shell = require("shelljs");

module.exports = async ({ source, destination, permissions, reUpload }) => {
  const target = destination.split(":")[0];
  const targetPath = destination.split(":")[1];
  return new Promise(resolve =>
    withSSH(target, async ssh => {
      if (ssh.isLocal) {
        if (reUpload) {
          shell.rm(targetPath);
        }
        shell.cp(source, targetPath);
        permissions && shell.chmod(permissions, targetPath);
        resolve(true);
      } else {
        if (reUpload) {
          await ssh.execCommand(`rm ${targetPath}`);
        }
        await ssh.putFile(source, targetPath);
        if (permissions) {
          await ssh.execCommand(`chmod ${permissions} ${targetPath}`);
        }
        ssh.dispose();
        resolve(true);
      }
    })
  );
};
