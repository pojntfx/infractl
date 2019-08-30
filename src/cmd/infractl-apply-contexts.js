#!/usr/bin/env node

const applyContext = require("../lib/actions/applyContext");

require("../lib/asGenericAction")({
  options: [
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
    commander.hetznerCloudApiEndpoint || commander.hetznerCloudApiAccessToken,
  action: commander =>
    applyContext({
      endpoint: commander.hetznerCloudApiEndpoint,
      token: commander.hetznerCloudApiAccessToken
    })
});
