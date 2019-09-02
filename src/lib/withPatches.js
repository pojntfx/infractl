// Wait with the patch until k3s has self-extracted
const withPatches = ({ ssh, manager }) =>
  new Promise(resolve =>
    ssh
      .execCommand(
        manager
          ? `ls /var/lib/rancher/k3s/data/*/bin/*; cat /var/lib/rancher/k3s/server/node-token`
          : `ls /var/lib/rancher/k3s/data/*/bin/*`
      )
      .then(res =>
        manager
          ? res.stdout.includes("bin/bridge") && res.stdout.includes("::node:")
          : res.stdout.includes("bin/bridge")
      )
      .then(extracted =>
        extracted
          ? ssh
              .execCommand(
                `mkdir -p /opt/cni/bin;
rm -rf /opt/cni/bin/*;
ln -sf /var/lib/rancher/k3s/data/*/bin/* /opt/cni/bin;`
              )
              .then(() => resolve(ssh))
          : setTimeout(
              () => withPatches({ ssh, manager }).then(() => resolve(ssh)),
              1000
            )
      )
  );

module.exports = withPatches;
