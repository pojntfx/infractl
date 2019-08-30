#!/usr/bin/env node

const getNode = require("../lib/actions/getNode");

require("../lib/asHetznerCloudAction")({
  args: "[id]",
  action: (commander, cloud) => getNode({ id: commander.args[0], cloud })
});
