#!/usr/bin/env node

const Contexts = require("../lib/models/contexts");

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
  action: commander => {
    const contexts = new Contexts();
    if (commander.hetznerCloudApiEndpoint) {
      contexts
        .applyHetznerCloudApiEndpoint(commander.hetznerCloudApiEndpoint)
        .then(() =>
          console.log("Hetzner Cloud API endpoint successfully set.")
        );
    }
    if (commander.hetznerCloudApiAccessToken) {
      contexts
        .applyHetznerCloudAccessToken(commander.hetznerCloudApiAccessToken)
        .then(() =>
          console.log("Hetzner Cloud API access token successfully set.")
        );
    }
  }
});
