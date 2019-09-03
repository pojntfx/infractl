#!/usr/bin/env node

const withTable = require("../lib/withTable");
const Networks = require("../lib/models/networks");

require("../lib/asGenericAction")({
  args: "[id]",
  options: [
    ["-n, --node <user@ip>", "Node from which to get the network members"]
  ],
  checker: commander => commander.node,
  action: commander => {
    const networks = new Networks();
    networks
      .getNode({ target: commander.args[0], node: commander.node })
      .then(nodes =>
        nodes.list
          ? withTable({
              headers: ["ID", "NAME", "READY", "EXTERNAL-IP", "INTERNAL-IP"],
              data: nodes.data
            }).then(table => console.log(table))
          : console.log(nodes.data)
      );
  }
});
