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
  ["networkworkers", "Delete network worker(s)", "networkworker"],
  ["networkmanagers", "Delete network manager(s)", "networkmanager"],
  ["networkbinaries", "Delete network binary/binaries", "networkbinary"],
  ["networkdatas", "Delete network data(s)", "networkdata"],
  ["nodes", "Delete node(s)", "node"],
  ["sshkeys", "Delete SSH key(s)", "sshkey"]
]);
