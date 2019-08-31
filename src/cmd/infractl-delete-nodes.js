#!/usr/bin/env node

const Nodes = require("../lib/models/nodes");

require("../lib/asHetznerCloudAction")({
  args: "<id> [otherIds...]",
  action: (commander, cloud) => {
    const nodes = new Nodes(cloud);
    commander.args.map(id =>
      nodes
        .delete(id)
        .then(() => console.log(`Node ${id} successfully deleted.`))
    );
  }
});
