const withSSH = require("../withSSH");

module.exports = async target =>
  new Promise(resolve =>
    withSSH(target, ssh =>
      ssh
        .execCommand(`cat /var/lib/rancher/k3s/server/node-token`)
        .then(result => {
          ssh.dispose();
          resolve(result.stdout);
        })
    )
  );
