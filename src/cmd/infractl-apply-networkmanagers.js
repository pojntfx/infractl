#!/usr/bin/env node

const {
  writeNetworkmanager,
  uploadNetworkmanager
} = require("../lib/actions/applyNetworkmanager");

require("../lib/asGenericAction")({
  args: "<user@ip> [otherTargets...]",
  options: [
    [
      "-u, --re-upload [true|false]",
      "Whether the networkmanager should be uploaded again if it already exists on the target (default false)"
    ]
  ],
  action: commander =>
    writeNetworkmanager().then(source =>
      commander.args.map(target =>
        uploadNetworkmanager({
          source,
          target,
          reUpload: commander.reUpload
        }).then(target =>
          console.log(`Network manager successfully applied on ${target}.`)
        )
      )
    )
});
