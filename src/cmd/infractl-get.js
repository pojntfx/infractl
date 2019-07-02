#!/usr/bin/env node

const commander = require("commander");

commander
  .command(
    "networks",
    "List all networks (without id) or get details on a network (with id)"
  )
  .alias("network")
  .command(
    "networkmembers",
    "List all network members of a network (without id) or get details on a network member (with id)"
  )
  .alias("networkmember")
  .parse(process.argv);
