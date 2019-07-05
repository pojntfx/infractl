#!/usr/bin/env node

const withTable = require("../lib/withTable");

require("../lib/asHetznerCloudAction")({
  args: "[id]",
  action: (commander, hetznerCloud) =>
    commander.args[0]
      ? hetznerCloud
          .getNode(commander.args[0])
          .then(node => console.log(JSON.stringify(node, null, 4)))
      : hetznerCloud.getNodes().then(nodes =>
          withTable({
            headers: ["ID", "NAME", "ONLINE", "IP", "OS", "TYPE", "LOCATION"],
            data: nodes.servers.map(
              ({
                id,
                name,
                status,
                public_net: {
                  ipv4: { ip }
                },
                server_type: { name: serverType },
                datacenter: { name: location },
                image: { name: os }
              }) => [
                id,
                name,
                status === "running",
                ip,
                os,
                serverType,
                location
              ]
            )
          }).then(table => console.log(table))
        )
});
