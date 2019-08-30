#!/usr/bin/env node

const {
  downloadNetworkbinary,
  uploadNetworkbinary
} = require("../lib/actions/applyNetworkbinary");

require("../lib/asGenericAction")({
  args: "<user@ip> [otherTargets...]",
  options: [
    [
      "-s, --source [source]",
      "Network binary's source (default https://github.com/costela/wesher/releases/download/v0.2.3/wesher-amd64)"
    ],
    [
      "-d, --re-download [true|false]",
      "Whether the binary should be downloaded again if it already exists locally (default false)"
    ],
    [
      "-u, --re-upload [true|false]",
      "Whether the binary should be uploaded again if it already exists on the target (default false)"
    ]
  ],
  action: async commander =>
    downloadNetworkbinary({
      source: commander.source,
      reDownload: commander.reDownload
    }).then(destination =>
      commander.args.map(target =>
        uploadNetworkbinary({
          source: destination,
          target,
          reUpload: commander.reDownload
        }).then(target =>
          console.log(`Network binary successfully applied to ${target}.`)
        )
      )
    )
});
