#!/usr/bin/env node

const Nodes = require("../lib/models/nodes");
const withTable = require("../lib/withTable");
const YAML = require("yaml");

require("../lib/asHetznerCloudAction")({
  args: "[id]",
  action: (commander, cloud) => {
    const nodes = new Nodes(cloud);
    nodes.get(commander.args[0]).then(nodes =>
      nodes.list
        ? withTable({
            headers: [
              "ID",
              "NAME",
              "READY",
              "EXTERNAL-IP",
              "OS",
              "TYPE",
              "LOCATION"
            ],
            data: nodes.data.servers.map(
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
        : console.log(YAML.stringify(nodes.data, null, 4))
    );
  }
});
