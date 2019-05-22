#!/usr/bin/env node

const commander = require("commander");

commander
  .command("networks", "Create network")
  .alias("network")
  .parse(process.argv);
