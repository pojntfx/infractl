const Configstore = require("configstore");
const package = require("../package.json");

const configstore = new Configstore(package.name);

module.exports.getZeroTierConfig = () => ({
  endpoint: configstore.get("zerotier.endpoint"),
  accessKey: configstore.get("zerotier.accessKey")
});
