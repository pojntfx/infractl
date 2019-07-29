#!/usr/bin/env node

require("../lib/asVerb")([
  [
    "networks",
    "List all networks (without id) or get details on a network (with id)",
    "network"
  ],
  [
    "networkmembers",
    "List all network members of a network (without id) or get details on a network member (with id)",
    "networkmember"
  ],
  [
    "nodes",
    "List all nodes (without id) or get details on a node (with id)",
    "node"
  ],
  [
    "sshkeys",
    "List all SSH keys (without id) or get details on a SSH key (with id)",
    "sshkey"
  ],
  ["networkpeers", "Get details on a network peer", "networkpeer"],
  ["clustertokens", "Get details on a cluster token", "clustertoken"],
  ["clusterconfigs", "Get details on a cluster config", "clusterconfig"]
]);
