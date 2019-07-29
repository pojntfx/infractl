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
  ["networkdatas", "Delete network data(s)", "networkdata"],
  ["clustermanagers", "Delete cluster manager(s)", "clustermanager"],
  ["clusterhybrids", "Delete cluster hybrid(s)", "clusterhybrid"],
  ["clusterworkers", "Delete cluster worker(s)", "clusterworker"],
  ["clusterbinaries", "Delete cluster binary/binaries", "clusterbinary"],
  ["clusterconfigs", "Delete cluster config(s)", "clusterconfig"],
  ["clusterdatas", "Delete cluster data(s)", "clusterdata"],
  ["clusterrouters", "Delete cluster router", "clusterrouter"]
]);
