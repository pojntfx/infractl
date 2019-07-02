#!/usr/bin/env node

const { setZeroTierConfig } = require("../lib/config");

require("../lib/asGenericAction")({
  options: [
    [
      "-z, --zerotier-api-endpoint <endpoint>",
      "ZeroTier API endpoint (i.e. https://my.zerotier.com/api)"
    ],
    [
      "-Z, --zerotier-api-access-token <token>",
      "ZeroTier API access token (i.e. VIh83kxrwYb3LGHfdS6BVhwGBAOXZMps)"
    ]
  ],
  checker: commander =>
    !(commander.zerotierApiEndpoint || commander.zerotierApiAccessToken),
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
  }
});
