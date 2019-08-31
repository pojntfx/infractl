const { setHetznerCloudConfig } = require("../config");

module.exports = class {
  async applyHetznerCloudApiEndpoint(endpoint) {
    return new Promise(resolve => {
      setHetznerCloudConfig({
        hetznerCloudApiEndpoint: endpoint
      });
      resolve(true);
    });
  }

  async applyHetznerCloudAccessToken(token) {
    return new Promise(resolve => {
      setHetznerCloudConfig({
        hetznerCloudApiAccessToken: token
      });
      resolve(true);
    });
  }
};
