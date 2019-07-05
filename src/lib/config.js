const Configstore = require("configstore");
const package = require("../../package.json");

const configstore = new Configstore(package.name);

module.exports.setZeroTierConfig = options => {
  options.zerotierApiEndpoint &&
    configstore.set("zerotier.endpoint", options.zerotierApiEndpoint);
  options.zerotierApiAccessToken &&
    configstore.set("zerotier.accessToken", options.zerotierApiAccessToken);
};

module.exports.setHetznerCloudConfig = options => {
  options.hetznerCloudApiEndpoint &&
    configstore.set("hetznerCloud.endpoint", options.hetznerCloudApiEndpoint);
  options.hetznerCloudApiAccessToken &&
    configstore.set(
      "hetznerCloud.accessToken",
      options.hetznerCloudApiAccessToken
    );
};

module.exports.withZeroTierConfig = async functionToGetConfig => {
  functionToGetConfig({
    endpoint: configstore.get("zerotier.endpoint"),
    accessToken: configstore.get("zerotier.accessToken")
  });
};

module.exports.withHetznerCloudConfig = async functionToGetConfig => {
  functionToGetConfig({
    endpoint: configstore.get("hetznerCloud.endpoint"),
    accessToken: configstore.get("hetznerCloud.accessToken")
  });
};
