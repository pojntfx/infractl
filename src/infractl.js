#!/usr/bin/env node

const commander = require("commander");

commander
  .version("0.0.1-alpha1")
  .command("create", "Create resources")
  .command("get", "Get resources")
  .command("update", "Update resources")
  .command("delete", "Delete resources")
  .command("setup", "Setup infractl")
  .parse(process.argv);