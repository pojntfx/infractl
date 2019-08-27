const Configstore = require("configstore");
const package = require("../../package.json");

const configstore = new Configstore(package.name);

module.exports.setHetznerCloudConfig = options => {
  options.hetznerCloudApiEndpoint &&
    configstore.set("hetznerCloud.endpoint", options.hetznerCloudApiEndpoint);
  options.hetznerCloudApiAccessToken &&
    configstore.set(
      "hetznerCloud.accessToken",
      options.hetznerCloudApiAccessToken
    );
};

module.exports.withHetznerCloudConfig = async functionToGetConfig => {
  functionToGetConfig({
    endpoint: configstore.get("hetznerCloud.endpoint"),
    accessToken: configstore.get("hetznerCloud.accessToken")
  });
};
