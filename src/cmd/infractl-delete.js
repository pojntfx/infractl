#!/usr/bin/env node

new (require("../lib/verb"))([
  ["workloadclusters", "Delete workload cluster(s)", "workloadcluster"],
  [
    "privatenetworkclusters",
    "Delete private network cluster(s)",
    "privatenetworkcluster"
  ],
  ["nodes", "Delete node(s)", "node"],
  ["keys", "Delete key(s)", "key"]
]);
