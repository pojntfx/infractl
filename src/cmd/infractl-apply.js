#!/usr/bin/env node

new (require("../lib/lean/verb"))([
  ["context", "Create or update context", "contexts"],
  ["key", "Create or update keys", "keys"],
  ["node", "Create or update nodes", "nodes"],
  ["cluster", "Create or update clusters", "clusters"]
]);
