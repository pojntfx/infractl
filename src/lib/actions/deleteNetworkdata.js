const withSSH = require("../withSSH");

module.exports = async target =>
  new Promise(resolve =>
    withSSH(target, ssh =>
      ssh.execCommand("rm -rf /var/lib/wesher").then(() => {
        ssh.dispose();
        resolve(target);
      })
    )
  );
