#!/usr/bin/env node

const applyNode = require("../lib/actions/applyNode");
const Nodes = require("../lib/models/nodes");
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
  action: (commander, cloud) => {
    const nodes = new Nodes(cloud);
    nodes
      .apply({
        id: commander.args[0],
        name: commander.nodeName,
        operatingSystem: commander.operatingSystem,
        nodeType: commander.nodeType,
        location: commander.location,
        sshKeys: commander.sshKeys,
        poweredOn: commander.poweredOn,
        cloud
      })
      .then(({ id, name, status, ip, os, serverType, location }) => {
        withTable({
          preceedingText: "Node successfully applied:",
          headers: ["ID", "NAME", "READY", "IP", "OS", "TYPE", "LOCATION"],
          data: [[id, name, status === "running", ip, os, serverType, location]]
        }).then(table => console.log(table));
      });
  }
});
