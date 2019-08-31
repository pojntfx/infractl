// Wait with the patch until k3s has self-extracted
const withPatches = ssh =>
  new Promise(resolve =>
    ssh
      .execCommand("ls /var/lib/rancher/k3s/data/*/bin/*")
      .then(res => res.stdout.includes("bin/bridge"))
      .then(extracted =>
        extracted
          ? ssh
              .execCommand(
                `mkdir -p /opt/cni/bin;
rm -rf /opt/cni/bin/*;
ln -sf /var/lib/rancher/k3s/data/*/bin/* /opt/cni/bin;`
              )
              .then(() => resolve(ssh))
          : setTimeout(() => withPatches(ssh).then(() => resolve(ssh)), 1000)
      )
  );

module.exports = withPatches;
