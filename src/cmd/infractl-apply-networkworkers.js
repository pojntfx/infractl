#!/usr/bin/env node

const {
  writeNetworkworker,
  uploadNetworkworker
} = require("../lib/actions/applyNetworkworker");

require("../lib/asGenericAction")({
  args: "<user@ip> [otherTargets...]",
  options: [
    [
      "-t, --network-token [networktoken]",
      "Worker's network token (i.e. Cpd2K+xm2u8OF/TB3s=)"
    ],
    ["-m, --manager [manager]", "Worker's manager (i.e. 159.69.80.168)"],
    [
      "-u, --re-upload [true|false]",
      "Whether the networkmanager should be uploaded again if it already exists on the target (default false)"
    ]
  ],
  checker: commander => commander.networkToken && commander.manager,
  action: commander =>
    writeNetworkworker({
      networkToken: commander.networkToken,
      manager: commander.manager
    }).then(source =>
      commander.args.map(target =>
        uploadNetworkworker({
          source,
          target,
          reUpload: commander.reUpload
        }).then(target =>
          console.log(`Network worker successfully applied on ${target}.`)
        )
      )
    )
});
