const withSSH = require("../withSSH");

module.exports = async target =>
  new Promise(resolve =>
    withSSH(target, ssh =>
      ssh
        .execCommand(
          "systemctl disable wesher-manager.service --now; rm -f /etc/systemd/system/wesher-manager.service; systemctl daemon-reload"
        )
        .then(() => {
          ssh.dispose();
          resolve(target);
        })
    )
  );
