#!/usr/bin/env node

const {
  writeClusterhybrid,
  uploadClusterhybrid
} = require("../lib/actions/applyClusterhybrid");

require("../lib/asGenericAction")({
  args: "<user@ip> [otherTargets...]",
  options: [
    [
      "-u, --re-upload [true|false]",
      "Whether the networkhybrid should be uploaded again if it already exists on the target (default false)"
    ],
    [
      "-i, --additional-ip [ip]",
      "Additional IP to provide certs for (i.e. 10.224.183.211)"
    ]
  ],
  action: commander =>
    writeClusterhybrid({
      additionalIp: commander.additionalIp
    }).then(source =>
      commander.args.map(target =>
        uploadClusterhybrid({
          source,
          target,
          reUpload: commander.reUpload
        }).then(target =>
          console.log(`Cluster hybrid successfully applied on ${target}.`)
        )
      )
    )
});
