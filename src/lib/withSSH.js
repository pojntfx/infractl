const SSH = require("node-ssh");

module.exports = async ({ address, privateKey }, functionToCall) => {
  const ssh = new SSH();
  ssh
    .connect({
      host: address.split("@")[1],
      username: address.split("@")[0],
      privateKey: privateKey || `${process.env.HOME}/.ssh/id_rsa`
    })
    .then(() => functionToCall(ssh));
};
