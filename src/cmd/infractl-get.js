#!/usr/bin/env node

require("../lib/asVerb")([
  [
    "networks",
    "List all networks (without id) or get details on a network (with id)",
    "network"
  ],
  [
    "networkmembers",
    "List all network members of a network (without id) or get details on a network member (with id)",
    "networkmember"
  ]
]);
