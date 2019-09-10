#!/usr/bin/env node

new (require("../lib/verb"))([
  ["keys", "Get key(s)", "key"],
  ["nodes", "Get node(s)", "node"],
  ["networktokens", "Get network token", "networktoken"],
  ["networknodes", "Get network nodes(s)", "networknode"],
  ["clustertokens", "Get network token", "clustertoken"],
  ["clusterconfigs", "Get network config", "clusterconfig"]
]);
