#!/usr/bin/env node

const commander = require("commander");
commander
  .command("networks", "Create or update network")
  .alias("network")
  .command("networkmembers", "Update network member")
  .alias("networkmember")
  .parse(process.argv);
