#!/usr/bin/env node

const commander = require("commander");
commander
  .command("networks", "Delete network")
  .alias("network")
  .parse(process.argv);
