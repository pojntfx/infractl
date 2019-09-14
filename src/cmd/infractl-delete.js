#!/usr/bin/env node

new (require("../lib/verb"))([
  [
    "workloadclusternodes",
    "Delete workload cluster node(s)",
    "workloadclusternode"
  ],
  [
    "privatenetworkclusternodes",
    "Delete private network cluster node(s)",
    "privatenetworkclusternode"
  ],
  ["nodes", "Delete node(s)", "node"],
  ["keys", "Delete key(s)", "key"]
]);
