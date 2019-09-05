#!/usr/bin/env node

const Logger = require("../lib/lean/logger");
const Pinger = require("../lib/lean/pinger");
const SSHer = require("../lib/lean/ssher");
const TmpFiler = require("../lib/lean/tmpfiler");
const Downloader = require("../lib/lean/downloader");
const OSer = require("../lib/lean/oser");
const Uploader = require("../lib/lean/uploader");
const Packager = require("../lib/lean/packager");
const Permissioner = require("../lib/lean/permissioner");
const Kernelr = require("../lib/lean/kernelr");
const Servicer = require("../lib/lean/servicer");
const Cryptographer = require("../lib/lean/cryptographer");
const IPer = require("../lib/lean/iper");
const Clusterer = require("../lib/lean/clusterer");

require("../lib/asGenericAction")({
  args: "<user@ip> [otherTargets...]",
  action: async commander => {
    // Set up logger
    const logger = new Logger();
    const localhost = `${process.env.USER}@${process.env.HOSTNAME}`;

    // Get nodes (here one could "plug in" the (`hetznersshkeys`, `hetznernodes`) or (`ctpfsshkeys`, `ctpfnodes`) actions)
    const networkManagerNode = commander.args[0];
    const networkWorkerNodes = commander.args.filter((_, index) => index !== 0);
    await logger.log(localhost, "Creating node data model");
    const allNodes = [networkManagerNode, ...networkWorkerNodes];
    await logger.divide();

    // Wait for node connectivity
    const pinger = new Pinger();
    await Promise.all(
      allNodes.map(async node => {
        await logger.log(node, "Waiting for node connectivity");
        return await pinger.waitForNode(`${node.split("@")[1]}:22`, 1000);
      })
    );
    await logger.divide();

    // Set up node access
    const nodeKeys = await Promise.all(
      allNodes.map(async node => {
        await logger.log(node, "Setting up node access");
        const isLocalSSHer = new SSHer(node);
        if (isLocalSSHer.isLocal) {
          return undefined;
        } else {
          const ssher = new SSHer(
            `${process.env.USER}@${process.env.HOSTNAME}`
          );
          return ssher.getKey(node.split("@")[1]);
        }
      })
    );
    const localSSHer = new SSHer(`${process.env.USER}@${process.env.HOSTNAME}`);
    await localSSHer.trustKeys(
      nodeKeys,
      `${process.env.HOME}/.ssh/known_hosts`
    );
    await logger.divide();

    // Get nodes' operating system
    const oser = new OSer();
    const nodeOperatingSystems = [];
    await Promise.all(
      allNodes.map(async node => {
        await logger.log(node, "Getting node's operating system");
        const nodeOperatingSystem = await oser.getOS(node);
        nodeOperatingSystems.push([node, nodeOperatingSystem]);
        return true;
      })
    );
    await logger.divide();

    // Set binary download sources
    const tmpFiler = new TmpFiler();
    const networkBinaries = [
      [
        "network core binary",
        "https://nx904.your-storageshare.de/s/9JSS9BsQEQTEW8E/download",
        await tmpFiler.getPath("wireguard-go"),
        "/usr/local/bin/wireguard-go"
      ],
      [
        "network interface binary",
        "https://nx904.your-storageshare.de/s/NLk8NdCPf4GqkZ9/download",
        await tmpFiler.getPath("wesher"),
        "/usr/local/bin/wesher"
      ]
    ];
    const debianFirewallBinaries = [
      [
        "firewall binary (Debian)",
        "https://nx904.your-storageshare.de/s/oZWcXHQEXB8qYb6/download",
        await tmpFiler.getPath("iptables.deb"),
        "/tmp/iptables.deb"
      ],
      [
        "new firewall library (Debian)",
        "https://nx904.your-storageshare.de/s/zCyzZH8QLwwxnwT/download",
        await tmpFiler.getPath("libnetfilter.deb"),
        "/tmp/libnetfilter.deb"
      ],
      [
        "legacy firewall library (Debian)",
        "https://nx904.your-storageshare.de/s/KKjjwJtGtYftkQ8/download",
        await tmpFiler.getPath("libxtables.deb"),
        "/tmp/libxtables.deb"
      ],
      [
        "firewall support library 1 (Debian)",
        "https://nx904.your-storageshare.de/s/WqGePH7oPAgPT5r/download",
        await tmpFiler.getPath("libmnl.deb"),
        "/tmp/libmnl.deb"
      ],
      [
        "firewall support library 2 (Debian)",
        "https://nx904.your-storageshare.de/s/59y8EabfWrnb2Hb/download",
        await tmpFiler.getPath("libnfnetlink0.deb"),
        "/tmp/libnfnetlink0.deb"
      ],
      [
        "firewall support library 3 (Debian)",
        "https://nx904.your-storageshare.de/s/Ew87MxWMRB3CcDG/download",
        await tmpFiler.getPath("libnftnl11.deb"),
        "/tmp/libnftnl11.deb"
      ]
    ];
    const centOSFirewallBinaries = [
      [
        "firewall binary (CentOS)",
        "https://nx904.your-storageshare.de/s/jkidqgeCMbmijmY/download",
        await tmpFiler.getPath("iptables.rpm"),
        "/tmp/iptables.rpm"
      ],
      [
        "firewall library (CentOS)",
        "https://nx904.your-storageshare.de/s/tnZaE4mojcokAWA/download",
        await tmpFiler.getPath("libnfnetlink.rpm"),
        "/tmp/libnfnetlink.rpm"
      ],
      [
        "firewall support binary (CentOS)",
        "https://nx904.your-storageshare.de/s/ogfp5bN8fZr67Qw/download",
        await tmpFiler.getPath("systemd-resolved.rpm"),
        "/tmp/systemd-resolved.rpm"
      ],
      [
        "firewall support library (CentOS)",
        "https://nx904.your-storageshare.de/s/xp9F8bGQPCwrZ3k/download",
        await tmpFiler.getPath("libnetfilter_conntrack.rpm"),
        "/tmp/libnetfilter_conntrack.rpm"
      ]
    ];

    // Check whether to download debian and/or centos packages
    const downloadDebianFirewallBinaries = nodeOperatingSystems.find(
      ([_, os]) => os === "debian"
    );
    const downloadCentOSFirewallBinaries = nodeOperatingSystems.find(
      ([_, os]) => os === "centos"
    );
    const binariesToDownload = networkBinaries
      .concat(
        downloadDebianFirewallBinaries && debianFirewallBinaries,
        downloadCentOSFirewallBinaries && centOSFirewallBinaries
      )
      .filter(Boolean);

    // Download binaries
    const downloader = new Downloader();
    const binariesToUpload = await Promise.all(
      binariesToDownload.map(
        async ([name, source, destination, finalDestination]) => {
          await logger.log(localhost, `Downloading ${name}`);
          const newSource = await downloader.download(source, destination);
          return [name, newSource, finalDestination];
        }
      )
    );
    await logger.divide();

    // Disable firewall service
    const servicer = new Servicer();
    await Promise.all(
      allNodes.map(async node => {
        await logger.log(node, "Disabling firewall service");
        return servicer.disableService(node, "firewalld.service");
      })
    );

    // Disable network manager service
    await logger.log(networkManagerNode, "Disabling network manager service");
    await servicer.disableService(
      networkManagerNode,
      "network-manager.service"
    );

    // Disable network worker service
    await Promise.all(
      networkWorkerNodes.map(async node => {
        await logger.log(node, "Disabling network worker service");
        return servicer.disableService(node, "network-worker.service");
      })
    );
    await logger.divide();

    // Upload binaries
    const uploader = new Uploader();
    const binariesToInstall = await Promise.all(
      allNodes.map(async node => {
        const uploadDebianBinaries = nodeOperatingSystems.find(
          ([debianNode, os]) => node === debianNode && os === "debian"
        );
        const uploadCentOSBinaries = nodeOperatingSystems.find(
          ([centOSNode, os]) => node === centOSNode && os === "centos"
        );
        return await Promise.all(
          binariesToUpload.map(async ([name, source, destination]) => {
            if (
              (uploadDebianBinaries &&
                debianFirewallBinaries.find(
                  ([originalName]) => originalName === name
                )) ||
              (uploadCentOSBinaries &&
                centOSFirewallBinaries.find(
                  ([originalName]) => originalName === name
                ))
            ) {
              await logger.log(node, `Uploading ${name}`);
              const newDestination = await uploader.upload(
                source,
                `${node}:${destination}`
              );
              return [
                name,
                newDestination,
                true,
                uploadDebianBinaries ? true : false
              ];
            } else if (
              networkBinaries.find(([originalName]) => originalName === name)
            ) {
              await logger.log(node, `Uploading ${name}`);
              const newDestination = await uploader.upload(
                source,
                `${node}:${destination}`
              );
              // These need not be installed as packages
              return [name, newDestination, false, undefined];
            }
          })
        );
      })
    );
    await logger.divide();

    // Install firewall binaries
    const packager = new Packager();
    await Promise.all(
      binariesToInstall.map(node =>
        Promise.all(
          node
            .filter(Boolean)
            .filter(([_, _2, shouldBeInstalled]) => shouldBeInstalled)
            .map(async ([name, destination, _, isDebianPackage]) => {
              await logger.log(destination.split(":")[0], `Installing ${name}`);
              return isDebianPackage
                ? await packager.installDebianPackage(destination)
                : await packager.installCentOSPackage(destination);
            })
        )
      )
    );
    await logger.divide();

    // Set network core binary's permissions
    const permissioner = new Permissioner();
    await Promise.all(
      binariesToInstall.map(node =>
        Promise.all(
          node
            .filter(Boolean)
            .filter(([_, _2, shouldBeInstalled]) => !shouldBeInstalled)
            .map(async ([name, destination]) => {
              await logger.log(
                destination.split(":")[0],
                `Setting permissions for ${name}`
              );
              return permissioner.setPermissions(destination, "+x");
            })
        )
      )
    );
    await logger.divide();

    // Create network kernel config
    const kernelr = new Kernelr();
    await logger.log(localhost, "Creating network kernel config");
    const networkKernelConfig = await kernelr.createConfig(
      ["net.ipv4.ip_forward = 1", "net.ipv4.conf.all.proxy_arp = 1"],
      await tmpFiler.getPath("network.conf")
    );

    // Upload network kernel config
    await Promise.all(
      allNodes.map(async node => {
        await logger.log(node, "Uploading network kernel config");
        return uploader.upload(
          networkKernelConfig,
          `${node}:/etc/network.conf`
        );
      })
    );

    // Apply network kernel config
    await Promise.all(
      allNodes.map(async node => {
        await logger.log(node, "Applying network kernel config");
        return kernelr.applyConfig(`${node}:/etc/network.conf`);
      })
    );
    await logger.divide();

    // Create network token
    const cryptographer = new Cryptographer();
    await logger.log(localhost, "Creating network token");
    const networkToken = await cryptographer.getRandomString(32);

    // Create network manager service
    await logger.log(localhost, "Creating network manager service");
    const networkManagerServiceSource = await servicer.createService({
      description: "Overlay network daemon (manager and worker)",
      execStart: `/usr/local/bin/wesher --cluster-key ${networkToken}`,
      environment: "WG_I_PREFER_BUGGY_USERSPACE_TO_POLISHED_KMOD=1",
      destination: await tmpFiler.getPath("network-manager.service")
    });

    // Create network worker service
    await logger.log(localhost, "Creating network worker service");
    const networkWorkerServiceSource = await servicer.createService({
      description: "Overlay network daemon (worker only)",
      execStart: `/usr/local/bin/wesher --cluster-key ${networkToken} --join ${
        networkManagerNode.split("@")[1]
      }`,
      environment: "WG_I_PREFER_BUGGY_USERSPACE_TO_POLISHED_KMOD=1",
      destination: await tmpFiler.getPath("network-worker.service")
    });
    await logger.divide();

    // Upload network manager service
    await logger.log(networkManagerNode, "Uploading network manager service");
    await uploader.upload(
      networkManagerServiceSource,
      `${networkManagerNode}:/etc/systemd/system/network-manager.service`
    );

    // Upload network worker service
    await Promise.all(
      networkWorkerNodes.map(async node => {
        await logger.log(node, "Uploading network worker service");
        return uploader.upload(
          networkWorkerServiceSource,
          `${node}:/etc/systemd/system/network-worker.service`
        );
      })
    );
    await logger.divide();

    // Reload services
    await Promise.all(
      allNodes.map(async node => {
        await logger.log(node, "Reloading services");
        return servicer.reloadServices(node);
      })
    );

    // Enable network manager service
    await logger.log(networkManagerNode, "Enabling network manager service");
    await servicer.enableService(networkManagerNode, "network-manager.service");

    // Enable network worker service
    await Promise.all(
      networkWorkerNodes.map(async node => {
        await logger.log(node, "Enabling network worker service");
        return servicer.enableService(node, "network-worker.service");
      })
    );
    await logger.divide();

    // Get network manager node in network
    const iper = new IPer();
    await logger.log(
      networkManagerNode,
      "Getting network manager node in network"
    );
    await servicer.waitForService(
      networkManagerNode,
      "network-manager.service",
      1000
    );
    await iper.waitForInterface(networkManagerNode, "wgoverlay", 1000);
    const networkManagerNodeInNetworkInterface = await iper.getInterface(
      networkManagerNode,
      "wgoverlay"
    );
    const networkManagerNodeInNetwork = [
      `${networkManagerNode.split("@")[0]}@${
        networkManagerNodeInNetworkInterface.ip
      }`,
      nodeOperatingSystems.find(([osNode]) => networkManagerNode === osNode)[1],
      networkManagerNode
    ];

    // Get network worker nodes in network
    const networkWorkerNodesInNetwork = [];
    await Promise.all(
      networkWorkerNodes.map(async node => {
        await logger.log(node, "Getting network worker node in network");
        await servicer.waitForService(node, "network-worker.service", 1000);
        await iper.waitForInterface(node, "wgoverlay", 1000);
        const networkWorkerNodeInNetworkInterface = await iper.getInterface(
          node,
          "wgoverlay"
        );
        networkWorkerNodesInNetwork.push([
          `${node.split("@")[0]}@${networkWorkerNodeInNetworkInterface.ip}`,
          nodeOperatingSystems.find(([osNode]) => node === osNode)[1],
          node
        ]);
        return true;
      })
    );

    // Create data model of network
    await logger.log(localhost, "Creating network node data model");
    const allNodesInNetwork = [
      networkManagerNodeInNetwork,
      ...networkWorkerNodesInNetwork
    ];
    await logger.divide();

    // Wait for node connectivity
    await Promise.all(
      allNodesInNetwork.map(async ([node]) => {
        await logger.log(node, "Waiting for network node connectivity");
        return await pinger.waitForNode(`${node.split("@")[1]}:22`, 1000);
      })
    );
    await logger.divide();

    // Set up network node access
    const networkNodeKeys = await Promise.all(
      allNodesInNetwork.map(async ([node]) => {
        await logger.log(node, "Setting up network node access");
        const isLocalSSHer = new SSHer(node);
        if (isLocalSSHer.isLocal) {
          return undefined;
        } else {
          const ssher = new SSHer(
            `${process.env.USER}@${process.env.HOSTNAME}`
          );
          return ssher.getKey(node.split("@")[1]);
        }
      })
    );
    await localSSHer.trustKeys(
      networkNodeKeys,
      `${process.env.HOME}/.ssh/known_hosts`
    );
    await logger.divide();

    // Create data model of cluster
    await logger.log(localhost, "Creating cluster node data model");
    const clusterManagerNodeInNetwork = networkManagerNodeInNetwork;
    const allNodesInNetworkForCluster = allNodesInNetwork.filter(node => {
      const ssher1 = new SSHer(node[0]);
      const ssher2 = new SSHer(node[2]);
      return !ssher1.isLocal && !ssher2.isLocal;
    });
    await logger.divide();

    // Set all cluster file download sources
    const clusterFiles = [
      [
        "universal",
        [
          [
            "cluster binary",
            "https://nx904.your-storageshare.de/s/gdXAndMz547n9z7/download",
            await tmpFiler.getPath("k3s"),
            "/usr/local/k3s"
          ]
        ]
      ],
      [
        "debian",
        [
          [
            "cluster storage binary package",
            "https://nx904.your-storageshare.de/s/Kg6ccPBzYSipEaS/download",
            await tmpFiler.getPath("open-iscsi.deb"),
            "/tmp/open-iscsi.deb"
          ],
          [
            "cluster storage library package",
            "https://nx904.your-storageshare.de/s/Krrqs8sBF4pDQZS/download",
            await tmpFiler.getPath("libisns0.deb"),
            "/tmp/libisns0.deb"
          ]
        ]
      ],
      [
        "centos",
        [
          [
            "cluster storage binary package",
            "https://nx904.your-storageshare.de/s/oFqwPAAPASSDLPo/download",
            await tmpFiler.getPath("iscsi-initiator-utils.rpm"),
            "/tmp/iscsi-initiator-utils.rpm"
          ],
          [
            "cluster storage library package",
            "https://nx904.your-storageshare.de/s/tPpxfo4saQMBFy2/download",
            await tmpFiler.getPath("iscsi-initiator-utils-iscsiuio.rpm"),
            "/tmp/iscsi-initiator-utils-iscsiuio.rpm"
          ],
          [
            "cluster storage support binary package",
            "https://nx904.your-storageshare.de/s/TyQ74Hn8Z6eKmHn/download",
            await tmpFiler.getPath("python.rpm"),
            "/tmp/python.rpm"
          ],
          [
            "cluster storage support library package",
            "https://nx904.your-storageshare.de/s/T2NCxspMYkMxo2p/download",
            await tmpFiler.getPath("python-libs.rpm"),
            "/tmp/python-libs.rpm"
          ]
        ]
      ]
    ];

    // Select the cluster files to download
    const clusterFilesToDownload = clusterFiles
      .filter(
        target =>
          target[0] === "universal" ||
          (allNodesInNetworkForCluster.find(([_, os]) => os === "debian") &&
            target[0] === "debian") ||
          (allNodesInNetworkForCluster.find(([_, os]) => os === "centos") &&
            target[0] === "centos")
      )
      .filter(Boolean);

    // Download cluster files
    const clusterFilesToUpload = await Promise.all(
      clusterFilesToDownload
        .reduce((a, b) => a.concat(b[1].map(binary => [...binary, b[0]])), [])
        .map(
          async ([
            name,
            source,
            localDestination,
            remoteDestination,
            operatingSystem
          ]) => {
            await logger.log(
              localhost,
              `Downloading ${name} (${operatingSystem})`
            );
            const newSource = await downloader.download(
              source,
              localDestination
            );
            return [name, newSource, remoteDestination, operatingSystem];
          }
        )
    );
    await logger.divide();

    // Set cluster services to disable
    const clusterServicesToDisable = [
      "cluster-manager.service",
      "cluster-worker.service",
      "systemd-resolved.service"
    ];

    // Disable cluster services
    const clusterServicesToEnable = await Promise.all(
      clusterServicesToDisable
        .map(service =>
          allNodesInNetworkForCluster.map(([node]) => `${node}:${service}`)
        )
        .reduce((a, b) => a.concat(b), [])
        .map(async destination => {
          await logger.log(
            destination.split(":")[0],
            `Disabling ${destination.split(":")[1]} service`
          );
          return await servicer.disableService(
            destination.split(":")[0],
            destination.split(":")[1]
          );
        })
    );
    await logger.divide();

    // Upload cluster files
    const clusterFilesToInstall = await Promise.all(
      allNodesInNetworkForCluster
        .map(([node, nodeOperatingSystem]) =>
          clusterFilesToUpload
            .filter(
              binary =>
                nodeOperatingSystem === binary[3] || binary[3] === "universal"
            )
            .map(([name, source, destination, binaryOperatingSystem]) => [
              name,
              source,
              `${node}:${destination}`,
              binaryOperatingSystem
            ])
        )
        .reduce((a, b) => a.concat(b), [])
        .map(async ([name, source, destination, operatingSystem]) => {
          await logger.log(
            destination.split(":")[0],
            `Uploading ${name} (${operatingSystem})`
          );
          const newSource = await uploader.upload(source, destination);
          return [name, newSource, operatingSystem];
        })
    );
    await logger.divide();

    // Install cluster files
    await Promise.all(
      clusterFilesToInstall.map(
        async ([name, destination, operatingSystem]) => {
          const node = destination.split(":")[0];
          if (operatingSystem === "universal") {
            await logger.log(
              node,
              `Setting permissions for ${name} (${operatingSystem})`
            );
            return permissioner.setPermissions(destination, "+x");
          } else if (operatingSystem === "debian") {
            await logger.log(node, `Installing ${name} (${operatingSystem})`);
            return packager.installDebianPackage(destination);
          } else {
            await logger.log(node, `Installing ${name} (${operatingSystem})`);
            return packager.installCentOSPackage(destination);
          }
        }
      )
    );
    await logger.divide();

    // Create cluster kernel config
    await logger.log(localhost, "Creating cluster kernel config");
    const clusterKernelConfig = await kernelr.createConfig(
      [
        "net.bridge.bridge-nf-call-ip6tables = 1",
        "net.bridge.bridge-nf-call-iptables = 1"
      ],
      await tmpFiler.getPath("cluster.conf")
    );

    // Upload cluster kernel config
    await Promise.all(
      allNodesInNetworkForCluster.map(async ([node]) => {
        await logger.log(node, "Uploading cluster kernel config");
        return uploader.upload(
          networkKernelConfig,
          `${node}:/etc/cluster.conf`
        );
      })
    );

    // Apply cluster kernel config
    await Promise.all(
      allNodesInNetworkForCluster.map(async ([node]) => {
        await logger.log(node, "Applying cluster kernel config");
        return kernelr.applyConfig(`${node}:/etc/cluster.conf`);
      })
    );
    await logger.divide();

    // Create cluster manager service
    await logger.log(localhost, "Creating cluster manager service");
    const clusterManagerServiceSource = await servicer.createService({
      description: "Cluster daemon (manager only)",
      execStart: `/usr/local/bin/k3s server --flannel-iface wgoverlay --tls-san ${
        clusterManagerNodeInNetwork[2].split("@")[1]
      } --disable-agent`,
      destination: await tmpFiler.getPath("cluster-manager.service")
    });

    // Upload cluster manager service
    await logger.log(
      clusterManagerNodeInNetwork[0],
      "Uploading cluster manager service"
    );
    await uploader.upload(
      clusterManagerServiceSource,
      `${
        clusterManagerNodeInNetwork[0]
      }:/etc/systemd/system/cluster-manager.service`
    );

    // Reload services on cluster manager node
    await logger.log(clusterManagerNodeInNetwork[0], "Reloading services");
    await servicer.reloadServices(clusterManagerNodeInNetwork[0]);

    // Enable cluster manager service on cluster manager node
    await logger.log(
      clusterManagerNodeInNetwork[0],
      "Enabling cluster-manager.service service"
    );
    await servicer.enableService(
      clusterManagerNodeInNetwork[0],
      "cluster-manager.service"
    );
    await logger.divide();

    // Get cluster token
    await logger.log(clusterManagerNodeInNetwork[0], "Getting cluster token");
    const clusterer = new Clusterer();
    await servicer.waitForService(
      clusterManagerNodeInNetwork[0],
      "cluster-manager.service",
      1000
    );
    await clusterer.waitForClusterToken(clusterManagerNodeInNetwork[0], 1000);
    const clusterToken = await clusterer.getClusterToken(
      clusterManagerNodeInNetwork[0]
    );
    console.log(clusterToken);
  }
});
