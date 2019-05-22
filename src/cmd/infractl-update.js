#!/usr/bin/env node

const commander = require("commander");
commander
  .command("networks", "Update network")
  .alias("network")
  .parse(process.argv);
