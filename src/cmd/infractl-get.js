#!/usr/bin/env node

require("../lib/asVerb")([
  [
    "sshkeys",
    "List all SSH keys (without id) or get details on a SSH key (with id)",
    "sshkey"
  ],
  [
    "nodes",
    "List all nodes (without id) or get details on a node (with id)",
    "node"
  ],
  ["networktokens", "Get details on a network token", "networktoken"],
  ["networknodes", "List all nodes of a network", "networknode"],
  ["clustertokens", "Get details on a cluster token", "clustertoken"],
  ["clusterconfigs", "Get details on a cluster config", "clusterconfig"]
]);
