#!/usr/bin/env node

const withTable = require("../lib/withTable");
const getNetworknodes = require("../lib/actions/getNetworknodes");

require("../lib/asGenericAction")({
  args: "[id]",
  options: [
    ["-n, --node <user@ip>", "Node from which to get the network members"]
  ],
  checker: commander => commander.node,
  action: commander =>
    getNetworknodes({ target: commander.args[0], node: commander.node }).then(
      nodes =>
        nodes.list
          ? withTable({
              headers: ["ID", "NAME", "READY", "IP"],
              data: nodes.data
            }).then(table => console.log(table))
          : console.log(nodes.data)
    )
});
