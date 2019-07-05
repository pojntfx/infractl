#!/usr/bin/env node

const withTable = require("../lib/withTable");

require("../lib/asZeroTierAction")({
  args: "[id]",
  action: (commander, zerotier) =>
    commander.args[0]
      ? zerotier
          .getNetwork(commander.args[0])
          .then(network => console.log(JSON.stringify(network, null, 4)))
      : zerotier.getNetworks().then(networks =>
          withTable({
            headers: ["ID", "NAME", "ONLINE", "AUTHORIZED", "PRIVATE"],
            data: networks.map(
              ({
                id,
                config: { name, private },
                onlineMemberCount,
                authorizedMemberCount
              }) => [
                id,
                name,
                onlineMemberCount,
                authorizedMemberCount,
                private
              ]
            )
          }).then(table => console.log(table))
        )
});
