#!/usr/bin/env node

const deleteNode = require("../lib/actions/deleteNode");

require("../lib/asHetznerCloudAction")({
  args: "<id> [otherIds...]",
  action: (commander, cloud) =>
    commander.args.map(id => deleteNode({ id, cloud }))
});
