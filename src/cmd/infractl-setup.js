#!/usr/bin/env node

const commander = require("commander");
const { setZeroTierConfig } = require("../lib/config");

commander
  .option(
    "-z, --zerotier-api-endpoint <endpoint>",
    "ZeroTier API endpoint (i.e. https://my.zerotier.com/api)"
  )
  .option(
    "-Z, --zerotier-api-access-token <token>",
    "ZeroTier API access token (i.e. VIh83kxrwYb3LGHfdS6BVhwGBAOXZMps)"
  )
  .parse(process.argv);

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

if (!(commander.zerotierApiEndpoint || commander.zerotierApiAccessToken)) {
  commander.outputHelp();
}
