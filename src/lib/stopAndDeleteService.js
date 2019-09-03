const withSSH = require("./withSSH");

module.exports = async ({ target, name }) =>
  new Promise(resolve =>
    withSSH(target, ssh =>
      ssh
        .execCommand(
          `sudo systemctl disable ${name} --now; sudo rm -f /etc/systemd/system/${name}; sudo systemctl daemon-reload`
        )
        .then(() => {
          ssh.dispose();
          resolve(target);
        })
    )
  );
