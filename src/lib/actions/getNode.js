const withTable = require("../withTable");
const YAML = require("yaml");

module.exports = async ({ id, cloud }) =>
  id
    ? cloud.getNode(id).then(node => console.log(YAML.stringify(node, null, 4)))
    : cloud.getNodes().then(nodes =>
        withTable({
          headers: ["ID", "NAME", "READY", "IP", "OS", "TYPE", "LOCATION"],
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
            }) => [id, name, status === "running", ip, os, serverType, location]
          )
        }).then(table => console.log(table))
      );
