# Felicitas Pojtinger's Infractl

A simple CLI to manage infrastructure for k3s clusters.

## Features

```plaintext
Usage: infractl [options] [command]

Options:
  -V, --version  output the version number
  -h, --help     output usage information

Commands:
  apply|a        Create or update resources
  get|g          Get resources
  delete|d       Delete resources
  setup|s        Setup infractl
  help [cmd]     display help for [cmd]
```

## Usage

```bash
# Install on Linux
curl -L https://gitlab.com/pojntfx/pojntfx/-/jobs/artifacts/master/download?job=infractl -o /tmp/infractl.zip && unzip /tmp/infractl.zip -d /tmp/infractl && sudo cp /tmp/infractl/packages/infractl/dist/infractl-linux /tmp/infractl/packages/infractl/dist/infractl && sudo install /tmp/infractl/packages/infractl/dist/infractl /usr/local/bin
# Install on macOS
curl -L https://gitlab.com/pojntfx/pojntfx/-/jobs/artifacts/master/download?job=infractl -o /tmp/infractl.zip && unzip /tmp/infractl.zip -d /tmp/infractl && sudo cp /tmp/infractl/packages/infractl/dist/infractl-macos /usr/local/bin/infractl
```

## Docs

See [Platform README](../../README.md).
