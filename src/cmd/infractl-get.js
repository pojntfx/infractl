#!/usr/bin/env node

const commander = require("commander");

commander
  .command(
    "networks",
    "List all networks (without id) or get details on a network (with id)"
  )
  .alias("network")
  .parse(process.argv);
