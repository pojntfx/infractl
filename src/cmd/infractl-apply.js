#!/usr/bin/env node

require("../lib/asVerb")([
  ["networks", "Create or update network", "network"],
  ["networkmembers", "Update network member", "networkmember"],
  ["nodes", "Create or update node", "node"],
  ["sshkeys", "Create or update SSH key", "sshkey"],
  ["networkbinaries", "Create or update network binary", "networkbinary"]
]);
