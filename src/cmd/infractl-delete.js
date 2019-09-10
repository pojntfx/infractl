#!/usr/bin/env node

new (require("../lib/verb"))([
  ["clusters", "Delete cluster(s)", "cluster"],
  ["nodes", "Delete node(s)", "node"],
  ["keys", "Delete key(s)", "key"]
]);
