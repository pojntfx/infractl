#!/usr/bin/env node

const commander = require("commander");
commander
  .command("networks", "Create or update network")
  .alias("network")
  .parse(process.argv);
