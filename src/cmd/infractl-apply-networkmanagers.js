#!/usr/bin/env node

const Networks = require("../lib/models/networks");

require("../lib/asGenericAction")({
  args: "<user@ip> [otherTargets...]",
  options: [
    [
      "-u, --re-upload [true|false]",
      "Whether the networkmanager should be uploaded again if it already exists on the target (default false)"
    ]
  ],
  action: commander => {
    const networks = new Networks();
    networks.writeManager().then(source =>
      commander.args.map(target =>
        networks
          .uploadManager({
            source,
            target,
            reUpload: commander.reUpload
          })
          .then(target =>
            console.log(`Network manager successfully applied on ${target}.`)
          )
      )
    );
  }
});
