const withSSH = require("../withSSH");

module.exports = async target =>
  new Promise(resolve =>
    withSSH(target, ssh =>
      ssh.execCommand("sudo rm -f /usr/local/bin/wesher").then(() => {
        ssh.dispose();
        resolve(target);
      })
    )
  );
