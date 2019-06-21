#!/usr/bin/env node

const commander = require("commander");
const ZeroTier = require("./zerotier");
commander.parse(process.argv);

const config = {
  zerotier: {
    endpoint: "https://my.zerotier.com/api",
    accessKey: "VIhkE1xrwYb3LGHfdS6BVhwGBAOXZMps"
  },
  hetzner: {
    accessKey:
      "neRbUONHXoGxA1OdDHdlTBczPLukEPxX6WMvnZt6u8QEXo4lR5PpHX0D25czt3xf"
  }
};

const zerotier = new ZeroTier(config.zerotier);

// zerotier.getNetworks().then(networks => console.log(networks));
// zerotier
//   .getNetwork("d3ecf5726df0ac91")
//   .then(network => console.log(JSON.stringify(network, null, 4)));
// zerotier
//   .upsertNetwork("d3ecf5726df0ac91", {
//     config: {
//       name: "devnet.pojtinger.space"
//     }
//   })
//   .then(network => console.log(JSON.stringify(network, null, 4)));
// zerotier
//   .upsertNetwork(undefined, {
//     config: {
//       name: "devnet2.pojtinger.com"
//     }
//   })
//   .then(network => console.log(JSON.stringify(network, null, 4)));
// zerotier.deleteNetwork("d3ecf5726d6abd9d");
// zerotier
//   .getNetworkMembers("d3ecf5726d0c0a1a")
//   .then(networkMembers => console.log(JSON.stringify(networkMembers, null, 4)));
// zerotier
//   .getNetworkMember("d3ecf5726d0c0a1a", "9f9da0f073")
//   .then(networkMember => console.log(JSON.stringify(networkMember, null, 4)));
zerotier
  .updateNetworkMember("d3ecf5726d0c0a1a", "9f9da0f073", {
    name: "thinkpadx1c3.pojtinger.com"
  })
  .then(networkMember => console.log(JSON.stringify(networkMember, null, 4)));
