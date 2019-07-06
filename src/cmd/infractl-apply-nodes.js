#!/usr/bin/env node

const withTable = require("../lib/withTable");

require("../lib/asHetznerCloudAction")({
  args: "[id]",
  options: [
    ["-n, --node-name [name]", "Node's name (i.e. observer-1)"],
    [
      "-o, --operating-system [os]",
      "Node's operating system (i.e. centos-7) (cannot be updated)"
    ],
    ["-t, --node-type [type]", "Node's type (i.e. cx21) (cannot be updated)"],
    [
      "-l, --location [datacenter]",
      "Node's location (fsn1,nbg1,hel1) (cannot be updated)"
    ],
    [
      "-k, --ssh-keys [key1,key2,...]",
      "Node's SSH keys (i.e. pojntfx@thinkpadx1c3.pojtinger.space) (cannot be updated)"
    ],
    [
      "-p, --powered-on [true|false]",
      "Whether the node should be powered on (default true)"
    ]
  ],
  checker: commander =>
    commander.nodeName ||
    commander.operatingSystem ||
    commander.nodeType ||
    commander.location ||
    commander.poweredOn ||
    commander.sshKeys,
  action: (commander, hetznerCloud) =>
    hetznerCloud
      .upsertNode(commander.args[0] || undefined, {
        name: commander.nodeName || undefined,
        image: (!commander.args[0] && commander.operatingSystem) || undefined,
        server_type: (!commander.args[0] && commander.nodeType) || undefined,
        location: (!commander.args[0] && commander.location) || undefined,
        ssh_keys:
          (!commander.args[0] && commander.sshKeys.split(",")) || undefined,
        start_after_create: !commander.args[0]
          ? commander.poweredOn === "false"
            ? false
            : commander.poweredOn === true
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
          commander.args[0]
            ? commander.poweredOn === "false"
              ? hetznerCloud
                  .updateNodeStatus(commander.args[0], false)
                  .then(updatedNode =>
                    withTable({
                      preceedingText: "Node successfully applied:",
                      headers: [
                        "ID",
                        "NAME",
                        "ONLINE",
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
              : commander.poweredOn === "true"
              ? hetznerCloud
                  .updateNodeStatus(commander.args[0], true)
                  .then(updatedNode =>
                    withTable({
                      preceedingText: "Node successfully applied:",
                      headers: [
                        "ID",
                        "NAME",
                        "ONLINE",
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
                    "ONLINE",
                    "IP",
                    "OS",
                    "TYPE",
                    "LOCATION"
                  ],
                  data: [
                    [
                      id,
                      name,
                      status === "running",
                      ip,
                      os,
                      serverType,
                      location
                    ]
                  ]
                }).then(table => console.log(table))
            : withTable({
                preceedingText: "Node successfully applied:",
                headers: [
                  "ID",
                  "NAME",
                  "ONLINE",
                  "IP",
                  "OS",
                  "TYPE",
                  "LOCATION"
                ],
                data: [
                  [id, name, status === "running", ip, os, serverType, location]
                ]
              }).then(table => console.log(table));
        }
      )
});
