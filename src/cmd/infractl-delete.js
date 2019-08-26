#!/usr/bin/env node

require("../lib/asVerb")([
  ["clusterstorages", "Delete cluster storage", "clusterstorage"],
  ["clusterrouters", "Delete cluster router", "clusterrouter"],
  ["clusterworkers", "Delete cluster worker(s)", "clusterworker"],
  ["clusterhybrids", "Delete cluster hybrid(s)", "clusterhybrid"],
  ["clustermanagers", "Delete cluster manager(s)", "clustermanager"],
  ["clusterbinaries", "Delete cluster binary/binaries", "clusterbinary"],
  ["clusterconfigs", "Delete cluster config(s)", "clusterconfig"],
  ["clusterdatas", "Delete cluster data(s)", "clusterdata"],
  [
    "networkjoinedmembers",
    "Delete network joined member(s)",
    "networkjoinedmember"
  ],
  ["networkpeers", "Delete network peer(s)", "networkpeer"],
  ["networkbinaries", "Delete network binary/binaries", "networkbinary"],
  ["networkdatas", "Delete network data(s)", "networkdata"],
  ["networks", "Delete network(s)", "network"],
  ["nodes", "Delete node(s)", "node"],
  ["sshkeys", "Delete SSH key(s)", "sshkey"]
]);
