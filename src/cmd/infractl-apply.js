#!/usr/bin/env node

require("../lib/asVerb")([
  ["contexts", "Create or update context (setup infractl)", "context"],
  ["sshkeys", "Create or update SSH key", "sshkey"],
  ["nodes", "Create or update node", "node"],
  ["networkbinaries", "Create or update network binary", "networkbinary"],
  ["networkmanagers", "Create or update network manager", "networkmanager"],
  ["networkworkers", "Create or update network worker", "networkworker"],
  ["clusterbinaries", "Create or update cluster binary", "clusterbinary"],
  ["clustermanagers", "Create or update cluster manager", "clustermanager"],
  ["clusterhybrids", "Create or update cluster hybrid", "clusterhybrid"],
  ["clusterworkers", "Create or update cluster worker", "clusterworker"],
  ["clusterrouters", "Create or update cluster router", "clusterrouter"],
  ["clusterstorages", "Create or update cluster storage", "clusterstorage"],
  ["clusters", "Create or update clusters", "cluster"],
  ["leans", "Create or update lean clusters", "lean"]
]);
