#!/usr/bin/env node

require("../lib/asVerb")([
  ["networks", "Delete network(s)", "network"],
  ["nodes", "Delete node(s)", "node"],
  ["sshkeys", "Delete SSH key(s)", "sshkey"],
  ["networkbinaries", "Delete network binary/binaries", "networkbinary"],
  ["networkpeers", "Delete network peer(s)", "networkpeer"],
  [
    "networkjoinedmembers",
    "Delete network joined member(s)",
    "networkjoinedmember"
  ]
]);
