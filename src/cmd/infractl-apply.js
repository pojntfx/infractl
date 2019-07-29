#!/usr/bin/env node

require("../lib/asVerb")([
  ["networks", "Create or update network", "network"],
  ["networkmembers", "Update network member", "networkmember"],
  ["nodes", "Create or update node", "node"],
  ["sshkeys", "Create or update SSH key", "sshkey"],
  ["networkbinaries", "Create or update network binary", "networkbinary"],
  ["networkpeers", "Create or update network peer", "networkpeer"],
  [
    "networkjoinedmembers",
    "Create or update network joined member",
    "networkjoinedmember"
  ],
  ["clusterbinaries", "Create or update cluster binary", "clusterbinary"],
  ["clustermanagers", "Create or update cluster manager", "clustermanager"],
  ["clusterhybrids", "Create or update cluster hybrid", "clusterhybrid"],
  ["clusterworkers", "Create or update cluster worker", "clusterworker"],
  ["clusterrouters", "Create or update cluster router", "clusterrouter"]
]);
