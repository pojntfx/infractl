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
      await tmpFiler.getPath("sysctl.conf")
    );

    // Upload network kernel config
    await Promise.all(
      allNodes.map(async node => {
        await logger.log(node, "Uploading network kernel config");
        return uploader.upload(networkKernelConfig, `${node}:/etc/sysctl.conf`);
      })
    );

    // Apply network kernel config
    await Promise.all(
      allNodes.map(async node => {
        await logger.log(node, "Applying network kernel config");
        return kernelr.applyConfig(`${node}:/etc/sysctl.conf`);
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
    const allNodesForCluster = allNodesInNetwork.filter(node => {
      const ssher = new SSHer(node[2]);
      return !ssher.isLocal;
    });
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

    console.log(networkManagerNodeInNetwork);
    console.log(networkWorkerNodesInNetwork);
    console.log(allNodesInNetwork);
    console.log(allNodesForCluster);
  }
});
