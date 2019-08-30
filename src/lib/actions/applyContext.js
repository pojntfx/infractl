const { setHetznerCloudConfig } = require("../config");

module.exports = async ({ endpoint, token }) => {
  if (endpoint) {
    setHetznerCloudConfig({
      hetznerCloudApiEndpoint: endpoint
    });
    console.log("Hetzner Cloud API endpoint successfully set.");
  }
  if (token) {
    setHetznerCloudConfig({
      hetznerCloudApiAccessToken: token
    });
    console.log("Hetzner Cloud API access token successfully set.");
  }
};
