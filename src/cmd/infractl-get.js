#!/usr/bin/env node

new (require("../lib/verb"))([
  ["keys", "Get key(s)", "key"],
  ["locations", "Get location(s)", "location"],
  ["types", "Get types(s)", "type"],
  ["oses", "Get OS(es)", "os"],
  ["nodes", "Get node(s)", "node"],
  [
    "privatenetworkclustertokens",
    "Get private network cluster token",
    "privatenetworkclustertoken"
  ],
  [
    "privatenetworkclusternodes",
    "Get private network cluster nodes(s)",
    "privatenetworkclusternode"
  ],
  [
    "workloadclustertokens",
    "Get workload cluster token",
    "workloadclustertoken"
  ],
  [
    "workloadclusterconfigs",
    "Get workload cluster config",
    "workloadclusterconfig"
  ]
]);
