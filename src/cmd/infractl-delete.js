#!/usr/bin/env node

require("../lib/asVerb")([
  ["networks", "Delete network(s)", "network"],
  ["nodes", "Delete node(s)", "node"],
  ["sshkeys", "Delete SSH key(s)", "sshkey"],
  [
    "networkjoinedmembers",
    "Delete network joined member(s)",
    "networkjoinedmember"
  ],
  ["networkpeers", "Delete network peer(s)", "networkpeer"],
  ["networkbinaries", "Delete network binary/binaries", "networkbinary"],
  ["networkconfigs", "Delete network config(s)", "networkconfig"]
]);
