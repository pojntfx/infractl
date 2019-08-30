const withSSH = require("./withSSH");

module.exports = async ({ target, name }) =>
  new Promise(resolve =>
    withSSH(target, ssh =>
      ssh
        .execCommand(
          `systemctl disable ${name} --now; rm -f /etc/systemd/system/${name}; systemctl daemon-reload`
        )
        .then(() => {
          ssh.dispose();
          resolve(target);
        })
    )
  );
