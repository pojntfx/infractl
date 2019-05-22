const Configstore = require("configstore");
const package = require("../../package.json");

const configstore = new Configstore(package.name);

module.exports.setZeroTierConfig = options => {
  options.zerotierApiEndpoint &&
    configstore.set("zerotier.endpoint", options.zerotierApiEndpoint);
  options.zerotierApiAccessToken &&
    configstore.set("zerotier.accessToken", options.zerotierApiAccessToken);
};

module.exports.withZeroTierConfig = async functionToGetConfig => {
  functionToGetConfig({
    endpoint: configstore.get("zerotier.endpoint"),
    accessToken: configstore.get("zerotier.accessToken")
  });
};
