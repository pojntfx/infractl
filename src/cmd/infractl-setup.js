#!/usr/bin/env node

const { setZeroTierConfig, setHetznerCloudConfig } = require("../lib/config");

require("../lib/asGenericAction")({
  options: [
    [
      "-z, --zerotier-api-endpoint <endpoint>",
      "ZeroTier API endpoint (i.e. https://my.zerotier.com/api)"
    ],
    [
      "-Z, --zerotier-api-access-token <token>",
      "ZeroTier API access token (i.e. VIh83kxrwYb3LGHfdS6BVhwGBAOXZMps)"
    ],
    [
      "-h, --hetzner-cloud-api-endpoint <endpoint>",
      "Hetzner Cloud API endpoint (i.e. https://api.hetzner.cloud/v1)"
    ],
    [
      "-H, --hetzner-cloud-api-access-token <token>",
      "Hetzner Cloud API access token (i.e. jEheVytlAoFl7F8MqUQ7jAo2hOXASztX)"
    ]
  ],
  checker: commander =>
    commander.zerotierApiEndpoint ||
    commander.zerotierApiAccessToken ||
    commander.hetznerCloudApiEndpoint ||
    commander.hetznerCloudApiAccessToken,
  action: commander => {
    if (commander.zerotierApiEndpoint) {
      setZeroTierConfig({ zerotierApiEndpoint: commander.zerotierApiEndpoint });
      console.log("ZeroTier API endpoint successfully set.");
    }
    if (commander.zerotierApiAccessToken) {
      setZeroTierConfig({
        zerotierApiAccessToken: commander.zerotierApiAccessToken
      });
      console.log("ZeroTier API access token successfully set.");
    }
    if (commander.hetznerCloudApiEndpoint) {
      setHetznerCloudConfig({
        hetznerCloudApiEndpoint: commander.hetznerCloudApiEndpoint
      });
      console.log("Hetzner Cloud API endpoint successfully set.");
    }
    if (commander.hetznerCloudApiAccessToken) {
      setHetznerCloudConfig({
        hetznerCloudApiAccessToken: commander.hetznerCloudApiAccessToken
      });
      console.log("Hetzner Cloud API access token successfully set.");
    }
  }
});
