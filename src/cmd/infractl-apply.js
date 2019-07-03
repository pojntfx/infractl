#!/usr/bin/env node

require("../lib/asVerb")([
  ["networks", "Create or update network", "network"],
  ["networkmembers", "Update network member", "networkmember"]
]);
