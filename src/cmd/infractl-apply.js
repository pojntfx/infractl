#!/usr/bin/env node

new (require("../lib/verb"))([
  ["contexts", "Create or update context(s)", "context"],
  ["keys", "Create or update key(s)", "key"],
  ["nodes", "Create or update node(s)", "node"],
  ["clusters", "Create or update cluster(s)", "cluster"]
]);
