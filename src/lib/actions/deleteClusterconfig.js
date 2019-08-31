const withSSH = require("../withSSH");

module.exports = async target =>
  new Promise(resolve =>
    withSSH(target, ssh =>
      ssh
        .execCommand(
          "rm -rf /etc/rancher; ip link del kube-bridge; ip link del dummy0; ip link del kube-dummy-if"
        )
        .then(() => {
          ssh.dispose();
          resolve(target);
        })
    )
  );
