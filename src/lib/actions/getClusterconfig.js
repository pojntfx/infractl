const withSSH = require("../withSSH");

module.exports = async target =>
  new Promise(resolve =>
    withSSH(target, ssh =>
      ssh.execCommand(`cat /etc/rancher/k3s/k3s.yaml`).then(result => {
        ssh.dispose();
        resolve(
          result.stdout &&
            result.stdout.replace("localhost", target.split("@")[1])
        );
      })
    )
  );
