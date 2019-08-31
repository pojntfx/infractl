module.exports = class {
  constructor(cloud) {
    this.cloud = cloud;
  }

  async apply({
    id,
    name,
    operatingSystem,
    nodeType,
    location,
    sshKeys,
    poweredOn
  }) {
    return new Promise(resolve =>
      this.cloud
        .upsertNode(id || undefined, {
          name: name || undefined,
          image: (!id && operatingSystem) || undefined,
          server_type: (!id && nodeType) || undefined,
          location: (!id && location) || undefined,
          ssh_keys: (!id && sshKeys.split(",")) || undefined,
          start_after_create: !id
            ? poweredOn === "false"
              ? false
              : poweredOn === true
              ? true
              : undefined
            : undefined
        })
        .then(
          ({
            server: {
              id,
              name,
              status,
              public_net: {
                ipv4: { ip }
              },
              server_type: { name: serverType },
              datacenter: { name: location },
              image: { name: os }
            }
          }) => {
            id
              ? poweredOn === "false"
                ? this.cloud.updateNodeStatus(id, false).then(updatedNode =>
                    resolve({
                      id,
                      name,
                      status: updatedNode.status === "running",
                      ip,
                      serverType,
                      location,
                      os
                    })
                  )
                : poweredOn === "true"
                ? this.cloud.updateNodeStatus(id, true).then(updatedNode =>
                    resolve({
                      id,
                      name,
                      status: updatedNode.status === "running",
                      ip,
                      serverType,
                      location,
                      os
                    })
                  )
                : resolve({
                    id,
                    name,
                    status: status === "running",
                    ip,
                    serverType,
                    location,
                    os
                  })
              : resolve({
                  id,
                  name,
                  status: status === "running",
                  ip,
                  serverType,
                  location,
                  os
                });
          }
        )
    );
  }

  async get(id) {
    return new Promise(resolve =>
      id
        ? this.cloud
            .getNode(id)
            .then(node => resolve({ list: false, data: node }))
        : this.cloud
            .getNodes()
            .then(nodes => resolve({ list: true, data: nodes }))
    );
  }

  async delete(id) {
    return this.cloud.deleteNode(id);
  }
};
