# Felicitas Pojtinger's Infractl

A simple CLI to manage infrastructure for k3s clusters.

## Features

```plaintext
Usage: infractl [options] [command]

Options:
  -V, --version  output the version number
  -h, --help     output usage information

Commands:
  get            Get resources
  help [cmd]     display help for [cmd]
```

## Usage

```bash
# Install on Linux
curl -L https://gitlab.com/pojntfx/pojntfx/-/jobs/artifacts/master/download?job=infractl -o /tmp/infractl.zip && unzip /tmp/infractl.zip -d /tmp/infractl && sudo cp /tmp/infractl/packages/infractl/dist/infractl-linux /usr/bin/infractl
# Install on macOS
curl -L https://gitlab.com/pojntfx/pojntfx/-/jobs/artifacts/master/download?job=infractl -o /tmp/infractl.zip && unzip /tmp/infractl.zip -d /tmp/infractl && sudo cp /tmp/infractl/packages/infractl/dist/infractl-macos /usr/bin/infractl
```

## Docs

See [Platform README](../../README.md).
