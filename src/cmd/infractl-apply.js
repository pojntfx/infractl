#!/usr/bin/env node

new (require("../lib/verb"))([
  ["contexts", "Create or update context(s)", "context"],
  ["keys", "Create or update key(s)", "key"],
  ["nodes", "Create or update node(s)", "node"],
  [
    "privatenetworkclusters",
    "Create or update private network cluster(s)",
    "privatenetworkcluster"
  ],
  [
    "workloadclusters",
    "Create or update workload cluster(s)",
    "workloadcluster"
  ]
]);
