const withTable = require("../lib/withTable");

module.exports = async ({
  id,
  name,
  operatingSystem,
  nodeType,
  location,
  sshKeys,
  poweredOn,
  cloud
}) =>
  cloud
    .upsertNode(id || undefined, {
      name: name || undefined,
      image: (!id && operatingSystem) || undefined,
      server_type: (!id && nodeType) || undefined,
      location: (!id && location) || undefined,
      ssh_keys: (!id && sshKeys.split(",")) || undefined,
      start_after_create: !id
        ? poweredOn === "false"
          ? false
          : poweredOn === true
          ? true
          : undefined
        : undefined
    })
    .then(
      ({
        server: {
          id,
          name,
          status,
          public_net: {
            ipv4: { ip }
          },
          server_type: { name: serverType },
          datacenter: { name: location },
          image: { name: os }
        }
      }) => {
        id
          ? poweredOn === "false"
            ? cloud.updateNodeStatus(id, false).then(updatedNode =>
                withTable({
                  preceedingText: "Node successfully applied:",
                  headers: [
                    "ID",
                    "NAME",
                    "READY",
                    "IP",
                    "OS",
                    "TYPE",
                    "LOCATION"
                  ],
                  data: [
                    [
                      id,
                      name,
                      updatedNode.status === "running",
                      ip,
                      os,
                      serverType,
                      location
                    ]
                  ]
                }).then(table => console.log(table))
              )
            : poweredOn === "true"
            ? cloud.updateNodeStatus(id, true).then(updatedNode =>
                withTable({
                  preceedingText: "Node successfully applied:",
                  headers: [
                    "ID",
                    "NAME",
                    "READY",
                    "IP",
                    "OS",
                    "TYPE",
                    "LOCATION"
                  ],
                  data: [
                    [
                      id,
                      name,
                      updatedNode.status === "running",
                      ip,
                      os,
                      serverType,
                      location
                    ]
                  ]
                }).then(table => console.log(table))
              )
            : withTable({
                preceedingText: "Node successfully applied:",
                headers: [
                  "ID",
                  "NAME",
                  "READY",
                  "IP",
                  "OS",
                  "TYPE",
                  "LOCATION"
                ],
                data: [
                  [id, name, status === "running", ip, os, serverType, location]
                ]
              }).then(table => console.log(table))
          : withTable({
              preceedingText: "Node successfully applied:",
              headers: ["ID", "NAME", "READY", "IP", "OS", "TYPE", "LOCATION"],
              data: [
                [id, name, status === "running", ip, os, serverType, location]
              ]
            }).then(table => console.log(table));
      }
    );
