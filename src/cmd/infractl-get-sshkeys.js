#!/usr/bin/env node

const getSSHKey = require("../lib/actions/getSSHKey");

require("../lib/asHetznerCloudAction")({
  args: "[id]",
  action: (commander, cloud) => getSSHKey({ id: commander.args[0], cloud })
});
