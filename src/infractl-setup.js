#!/usr/bin/env node

const { setZeroTierConfig } = require("./config");
const commander = require("commander");
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
  console.log("ZeroTier API endpoint set.");
}

if (commander.zerotierApiAccessToken) {
  setZeroTierConfig({
    zerotierApiAccessToken: commander.zerotierApiAccessToken
  });
  console.log("ZeroTier API access token set.");
}

if (!(commander.zerotierApiEndpoint || commander.zerotierApiAccessToken)) {
  commander.outputHelp();
}