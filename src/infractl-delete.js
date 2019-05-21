#!/usr/bin/env node

const commander = require("commander");
commander
  .command("networks", "Delete network(s)")
  .alias("network")
  .parse(process.argv);
