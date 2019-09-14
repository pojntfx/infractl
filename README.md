# Felicitas Pojtinger's InfraCTL

A CLI to manage supra-cloud SSH keys, nodes, WireGuard overlay networks and Kubernetes clusters.

## Features

```plaintext
Usage: infractl [options] [command]

A CLI to manage supra-cloud SSH keys, nodes, WireGuard overlay networks and Kubernetes clusters.

Options:
  -V, --version  output the version number
  -h, --help     output usage information

Commands:
  apply|a        Create or update resources
  get|g          Get resources
  delete|d       Delete resources
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
