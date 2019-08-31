#!/usr/bin/env node

const Networks = require("../lib/models/networks");

require("../lib/asGenericAction")({
  args: "<user@ip> [otherTargets...]",
  action: commander => {
    const networks = new Networks();
    commander.args.map(target =>
      networks
        .deleteBinary(target)
        .then(target =>
          console.log(`Network binary successfully deleted on ${target}.`)
        )
    );
  }
});
