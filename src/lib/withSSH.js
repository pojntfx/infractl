const SSH = require("node-ssh");

module.exports = async (address, functionToCall) => {
  const ssh = new SSH();
  ssh
    .connect({
      host: address.split("@")[1],
      username: address.split("@")[0],
      agent: process.env.SSH_AUTH_SOCK
    })
    .then(() => functionToCall(ssh));
};
