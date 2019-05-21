#!/usr/bin/env node

const commander = require("commander");

commander
  .version("0.0.1-alpha1")
  .command("get", "Get resources")
  .parse(process.argv);
