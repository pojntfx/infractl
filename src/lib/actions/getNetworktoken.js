const withSSH = require("../withSSH");

module.exports = async target =>
  new Promise(resolve =>
    withSSH(target, ssh =>
      ssh
        .execCommand(`cat /etc/systemd/system/wesher-manager.service`)
        .then(result => {
          ssh.dispose();
          resolve(
            result.stdout &&
              result.stdout
                .split("--cluster-key")[1]
                .split("\n")[0]
                .replace(" ", "")
          );
        })
    )
  );
