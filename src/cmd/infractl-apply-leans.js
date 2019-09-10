#!/usr/bin/env node

const Logger = require("../lib/lean/logger");
const Pinger = require("../lib/lean/pinger");
const SSHer = require("../lib/lean/ssher");
const networkFilesRaw = require("../lib/lean/networkFiles.json");
const TmpFiler = require("../lib/lean/tmpfiler");
const Downloader = require("../lib/lean/downloader");
const OSer = require("../lib/lean/oser");
const Uploader = require("../lib/lean/uploader");
const Packager = require("../lib/lean/packager");
const clusterFilesRaw = require("../lib/lean/clusterFiles.json");
const SELinuxer = require("../lib/lean/selinuxer");
const Permissioner = require("../lib/lean/permissioner");
const Kernelr = require("../lib/lean/kernelr");
const Servicer = require("../lib/lean/servicer");
const Cryptographer = require("../lib/lean/cryptographer");
const IPer = require("../lib/lean/iper");
const Modprober = require("../lib/lean/modprober");
const Clusterer = require("../lib/lean/clusterer");
const Hostnamer = require("../lib/lean/hostnamer");
const Homer = require("../lib/lean/homer");

require("../lib/asGenericAction")({
  args: "<user@ip> [otherTargets...]",
  action: async commander => {
    // Set up logger
    const logger = new Logger();
    const hostnamer = new Hostnamer();
    const localUsername = hostnamer.getUsername();
    const localHostname = hostnamer.getHostname();
    const localhost = `${localUsername}@${localHostname}`;

    // Create initial data model
    // Here one could "plug in" the (`hetznersshkeys`, `hetznernodes`) or (`ctpfsshkeys`, `ctpfnodes`) actions)
    await logger.log(localhost, "Creating initial node data model");
    const networkManagerNodeSimple = commander.args[0];
    const networkWorkerNodesSimple = commander.args.filter(
      (_, index) => index !== 0
    );
    const allNodesSimple = [
      networkManagerNodeSimple,
      ...networkWorkerNodesSimple
    ];
    await logger.divide();

    // Wait for node connectivity
    const pinger = new Pinger();
    await Promise.all(
      allNodesSimple.map(async node => {
        await logger.log(node, "Waiting for node connectivity");
        return await pinger.waitForNode(`${node.split("@")[1]}:22`, 1000);
      })
    );
    await logger.divide();

    // Set up node access
    const nodeKeys = await Promise.all(
      allNodesSimple.map(async node => {
        await logger.log(node, "Setting up node access");
        const isLocalSSHer = new SSHer(node);
        if (isLocalSSHer.isLocal) {
          return undefined;
        } else {
          const ssher = new SSHer(`${localUsername}@${localHostname}`);
          return ssher.getKey(node.split("@")[1]);
        }
      })
    );
    const localSSHer = new SSHer(`${localUsername}@${localHostname}`);
    const homer = new Homer();
    await localSSHer.trustKeys(
      nodeKeys,
      `${homer.getHomeDirectory()}/.ssh/known_hosts`
    );
    await logger.divide();

    // Get nodes' operating system
    const oser = new OSer();
    const nodeOperatingSystems = [];
    await Promise.all(
      allNodesSimple.map(async node => {
        await logger.log(node, "Getting node's operating system");
        const nodeOperatingSystem = await oser.getOS(node);
        return nodeOperatingSystems.push([node, nodeOperatingSystem]);
      })
    );
    await logger.divide();

    // Create advanced node data model
    await logger.log(localhost, "Creating advanced node data model");
    const networkManagerNode = [
      networkManagerNodeSimple,
      nodeOperatingSystems.find(
        ([operatingSystemNode]) =>
          operatingSystemNode === networkManagerNodeSimple
      )[1]
    ];
    const networkWorkerNodes = networkWorkerNodesSimple.map(node => [
      node,
      nodeOperatingSystems.find(
        ([operatingSystemNode]) => operatingSystemNode === node
      )[1]
    ]);
    const allNodes = [networkManagerNode, ...networkWorkerNodes];
    await logger.divide();

    // Set all network file download sources
    const tmpFiler = new TmpFiler();
    const networkFiles = await Promise.all(
      networkFilesRaw.map(async fileType => [
        fileType[0],
        await Promise.all(
          fileType[1].map(
            async ([name, source, localDestination, remoteDestination]) => [
              name,
              source,
              await tmpFiler.getPath(localDestination),
              remoteDestination
            ]
          )
        )
      ])
    );

    // Select the network files to download
    const networkFilesToDownload = networkFiles
      .filter(
        target =>
          target[0] === "universal" ||
          (allNodes.find(([_, os]) => os === "debian") &&
            target[0] === "debian") ||
          (allNodes.find(([_, os]) => os === "centos") &&
            target[0] === "centos")
      )
      .filter(Boolean);

    // Download network files
    const downloader = new Downloader();
    const networkFilesToUpload = await Promise.all(
      networkFilesToDownload
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
            return Promise.all([
              name,
              newSource,
              remoteDestination,
              operatingSystem
            ]);
          }
        )
    );
    await logger.divide();

    // Set network services to disable
    const networkServicesToDisable = [
      "firewalld.service",
      "network-manager.service",
      "network-worker.service"
    ];

    // Disable network services
    const servicer = new Servicer();
    await Promise.all(
      networkServicesToDisable
        .map(service => allNodes.map(([node]) => `${node}:${service}`))
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

    // Upload network files
    const uploader = new Uploader();
    const networkFilesToInstall = await Promise.all(
      allNodes
        .map(([node, nodeOperatingSystem]) =>
          networkFilesToUpload
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
          const newSource = await uploader.upload(
            source,
            destination,
            operatingSystem === "universal"
          );
          return await Promise.all([name, newSource, operatingSystem]);
        })
    );
    await logger.divide();

    // Re-order the network files by nodes
    const networkFilesToInstallByNodes = networkFilesToInstall
      .reduce(
        (allFiles, file) =>
          allFiles.find(node =>
            node[0] !== ""
              ? node[0].split(":")[0] === file[1].split(":")[0]
              : false
          )
            ? allFiles.map(localNode =>
                localNode[0].split(":")[0] === file[1].split(":")[0]
                  ? [localNode[0], [...localNode[1], file]]
                  : localNode
              )
            : [...allFiles, [file[1].split(":")[0], [file]]],
        [["", [""]]]
      )
      .filter(node => node[0] !== "");

    // Install network files
    const packager = new Packager();
    const permissioner = new Permissioner();
    await Promise.all(
      networkFilesToInstallByNodes.map(async ([node, files]) => {
        const universalFiles = files.filter(file => file[2] === "universal");
        const debianFiles = files.filter(file => file[2] === "debian");
        const centOSFiles = files.filter(file => file[2] === "centos");

        if (universalFiles.length > 0) {
          await Promise.all(
            universalFiles.map(async ([name, destination, operatingSystem]) => {
              await logger.log(
                node,
                `Setting permissions for ${name} (${operatingSystem})`
              );
              return await permissioner.setPermissions(destination, "+x", true);
            })
          );
        }
        // The following ones can't be installed in parallel; `dpkg` and `rpm` use lock files
        if (debianFiles.length > 0) {
          for (file of debianFiles) {
            await logger.log(node, `Installing ${file[0]} (${file[2]})`);
            await packager.installDebianPackage(file[1]);
          }
        }
        if (centOSFiles.length > 0) {
          for (file of centOSFiles) {
            await logger.log(node, `Installing ${file[0]} (${file[2]})`);
            await packager.installCentOSPackage(file[1]);
          }
        }

        return true;
      })
    );
    await logger.divide();

    // Create network kernel config
    const kernelr = new Kernelr();
    await logger.log(localhost, "Creating network kernel config");
    const networkKernelConfig = await kernelr.createConfig(
      ["net.ipv4.ip_forward = 1", "net.ipv4.conf.all.proxy_arp = 1"],
      await tmpFiler.getPath("network.conf")
    );
    await logger.divide();

    // Upload network kernel config
    await Promise.all(
      allNodes.map(async ([node]) => {
        await logger.log(node, "Uploading network kernel config");
        return await uploader.upload(
          networkKernelConfig,
          `${node}:/etc/network.conf`,
          true
        );
      })
    );
    await logger.divide();

    // Apply network kernel config
    await Promise.all(
      allNodes.map(async ([node]) => {
        await logger.log(node, "Applying network kernel config");
        return await kernelr.applyConfig(`${node}:/etc/network.conf`);
      })
    );
    await logger.divide();

    // Create network token
    const cryptographer = new Cryptographer();
    await logger.log(localhost, "Creating network token");
    const networkToken = await cryptographer.getRandomString(32);
    await logger.divide();

    // Create network manager service
    await logger.log(localhost, "Creating network manager service");
    const networkManagerServiceSource = await servicer.createService({
      description: "Overlay network daemon (manager and worker)",
      execStart: `/bin/sh -c "/usr/local/bin/wireguard-go wgoverlay && /usr/local/bin/wesher --bind-addr ${
        networkManagerNode[0].split("@")[1]
      } --cluster-key ${networkToken}"`,
      environment: "WG_I_PREFER_BUGGY_USERSPACE_TO_POLISHED_KMOD=1",
      destination: await tmpFiler.getPath("network-manager.service")
    });
    await logger.divide();

    // Create network worker service
    await logger.log(localhost, "Creating network worker service");
    const networkWorkerServiceSource = await servicer.createService({
      description: "Overlay network daemon (worker only)",
      execStart: `/bin/sh -c "/usr/local/bin/wireguard-go wgoverlay && /usr/local/bin/wesher --cluster-key ${networkToken} --join ${
        networkManagerNode[0].split("@")[1]
      }"`,
      environment: "WG_I_PREFER_BUGGY_USERSPACE_TO_POLISHED_KMOD=1",
      destination: await tmpFiler.getPath("network-worker.service")
    });
    await logger.divide();

    // Upload network manager service
    await logger.log(
      networkManagerNode[0],
      "Uploading network manager service"
    );
    await uploader.upload(
      networkManagerServiceSource,
      `${networkManagerNode[0]}:/etc/systemd/system/network-manager.service`,
      true
    );
    await logger.divide();

    // Upload network worker service
    await Promise.all(
      networkWorkerNodes.map(async ([node]) => {
        await logger.log(node, "Uploading network worker service");
        return uploader.upload(
          networkWorkerServiceSource,
          `${node}:/etc/systemd/system/network-worker.service`,
          true
        );
      })
    );
    await logger.divide();

    // Reload services
    await Promise.all(
      allNodes.map(async ([node]) => {
        await logger.log(node, "Reloading services");
        return servicer.reloadServices(node);
      })
    );
    await logger.divide();

    // Enable network manager service
    await logger.log(networkManagerNode[0], "Enabling network manager service");
    await servicer.enableService(
      networkManagerNode[0],
      "network-manager.service"
    );
    await logger.divide();

    // Enable network worker service
    await Promise.all(
      networkWorkerNodes.map(async ([node]) => {
        await logger.log(node, "Enabling network worker service");
        return servicer.enableService(node, "network-worker.service");
      })
    );
    await logger.divide();

    // Get network manager node in network
    const iper = new IPer();
    await logger.log(
      networkManagerNode[0],
      "Getting network manager node in network"
    );
    await servicer.waitForService(
      networkManagerNode[0],
      "network-manager.service",
      1000
    );
    await iper.waitForInterface(networkManagerNode[0], "wgoverlay", 1000);
    const networkManagerNodeInNetworkInterface = await iper.getInterface(
      networkManagerNode[0],
      "wgoverlay"
    );
    const networkManagerNodeInNetwork = [
      `${networkManagerNode[0].split("@")[0]}@${
        networkManagerNodeInNetworkInterface.ip
      }`,
      networkManagerNode[1],
      networkManagerNode[0]
    ];
    await logger.divide();

    // Get network worker nodes in network
    const networkWorkerNodesInNetwork = [];
    await Promise.all(
      networkWorkerNodes.map(async ([node]) => {
        await logger.log(node, "Getting network worker node in network");
        await servicer.waitForService(node, "network-worker.service", 1000);
        await iper.waitForInterface(node, "wgoverlay", 1000);
        const networkWorkerNodeInNetworkInterface = await iper.getInterface(
          node,
          "wgoverlay"
        );
        return networkWorkerNodesInNetwork.push([
          `${node.split("@")[0]}@${networkWorkerNodeInNetworkInterface.ip}`,
          nodeOperatingSystems.find(([osNode]) => node === osNode)[1],
          node
        ]);
      })
    );
    await logger.divide();

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
          const ssher = new SSHer(`${localUsername}@${localHostname}`);
          return await ssher.getKey(node.split("@")[1]);
        }
      })
    );
    await localSSHer.trustKeys(
      networkNodeKeys,
      `${homer.getHomeDirectory()}/.ssh/known_hosts`
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
    const clusterWorkerNodesInNetwork = allNodesInNetworkForCluster.filter(
      node =>
        networkManagerNodeInNetwork[0] !== node[0] &&
        networkManagerNodeInNetwork[2] !== node[2]
    );
    await logger.divide();

    // Set all cluster file download sources
    const clusterFiles = await Promise.all(
      clusterFilesRaw.map(async fileType => [
        fileType[0],
        await Promise.all(
          fileType[1].map(
            async ([name, source, localDestination, remoteDestination]) => [
              name,
              source,
              await tmpFiler.getPath(localDestination),
              remoteDestination
            ]
          )
        )
      ])
    );

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
            return Promise.all([
              name,
              newSource,
              remoteDestination,
              operatingSystem
            ]);
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
    await Promise.all(
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
          const newSource = await uploader.upload(
            source,
            destination,
            operatingSystem === "universal"
          );
          return await Promise.all([name, newSource, operatingSystem]);
        })
    );
    await logger.divide();

    // Re-order the cluster files by nodes
    const clusterFilesToInstallByNodes = clusterFilesToInstall
      .reduce(
        (allFiles, file) =>
          allFiles.find(node =>
            node[0] !== ""
              ? node[0].split(":")[0] === file[1].split(":")[0]
              : false
          )
            ? allFiles.map(localNode =>
                localNode[0].split(":")[0] === file[1].split(":")[0]
                  ? [localNode[0], [...localNode[1], file]]
                  : localNode
              )
            : [...allFiles, [file[1].split(":")[0], [file]]],
        [["", [""]]]
      )
      .filter(node => node[0] !== "");

    // Install cluster files
    await Promise.all(
      clusterFilesToInstallByNodes.map(async ([node, files]) => {
        const universalFiles = files.filter(file => file[2] === "universal");
        const debianFiles = files.filter(file => file[2] === "debian");
        const centOSFiles = files.filter(file => file[2] === "centos");

        if (universalFiles.length > 0) {
          await Promise.all(
            universalFiles.map(async ([name, destination, operatingSystem]) => {
              await logger.log(
                node,
                `Setting permissions for ${name} (${operatingSystem})`
              );
              return await permissioner.setPermissions(destination, "+x", true);
            })
          );
        }
        // The following ones can't be installed in parallel; `dpkg` and `rpm` use lock files
        if (debianFiles.length > 0) {
          for (file of debianFiles) {
            await logger.log(node, `Installing ${file[0]} (${file[2]})`);
            await packager.installDebianPackage(file[1]);
          }
        }
        if (centOSFiles.length > 0) {
          for (file of centOSFiles) {
            await logger.log(node, `Installing ${file[0]} (${file[2]})`);
            await packager.installCentOSPackage(file[1]);
          }
        }

        return true;
      })
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
    await logger.divide();

    // Upload cluster kernel config
    await Promise.all(
      allNodesInNetworkForCluster.map(async ([node]) => {
        await logger.log(node, "Uploading cluster kernel config");
        return await uploader.upload(
          clusterKernelConfig,
          `${node}:/etc/cluster.conf`,
          true
        );
      })
    );
    await logger.divide();

    // Apply cluster kernel config
    await Promise.all(
      allNodesInNetworkForCluster.map(async ([node]) => {
        await logger.log(node, "Applying cluster kernel config");
        return await kernelr.applyConfig(`${node}:/etc/cluster.conf`);
      })
    );
    await logger.divide();

    // Load br_netfilter module
    const modprober = new Modprober();
    await Promise.all(
      allNodesInNetworkForCluster.map(async ([node]) => {
        await logger.log(node, "Loading br_netfilter kernel module");
        return await modprober.modprobe(node, "br_netfilter");
      })
    );
    await logger.divide();

    // Set SELinux context
    const selinuxer = new SELinuxer();
    await Promise.all(
      allNodesInNetworkForCluster.map(async ([node]) => {
        await logger.log(node, "Setting SELinux context");
        await selinuxer.setenforce(node, "Permissive");
        await selinuxer.semanage(`${node}:/usr/local/bin/k3s`);
        return await selinuxer.restorecon(`${node}:/usr/local/bin/k3s`);
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
    await logger.divide();

    // Upload cluster manager service
    await logger.log(
      clusterManagerNodeInNetwork[0],
      "Uploading cluster manager service"
    );
    await uploader.upload(
      clusterManagerServiceSource,
      `${
        clusterManagerNodeInNetwork[0]
      }:/etc/systemd/system/cluster-manager.service`,
      true
    );
    await logger.divide();

    // Upload cluster storage manifest
    await logger.log(
      clusterManagerNodeInNetwork[0],
      "Uploading cluster storage manifest"
    );
    await uploader.createDirectory(
      `${clusterManagerNodeInNetwork[0]}:/var/lib/rancher/k3s/server/manifests`,
      true
    );
    await uploader.upload(
      `${__dirname}/../lib/lean/storageFile.yaml`,
      `${
        clusterManagerNodeInNetwork[0]
      }:/var/lib/rancher/k3s/server/manifests/storageFile.yaml`,
      true
    );
    await logger.divide();

    // Reload services on all cluster nodes
    await Promise.all(
      allNodesInNetworkForCluster.map(async ([node]) => {
        await logger.log(node, "Reloading services");
        return await servicer.reloadServices(node);
      })
    );
    await logger.divide();

    // Enable systemd-resolved service on all cluster nodes
    await Promise.all(
      allNodesInNetworkForCluster.map(async ([node]) => {
        await logger.log(node, "Enabling systemd-resolved.service service");
        return await servicer.enableService(node, "systemd-resolved.service");
      })
    );
    await logger.divide();

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
    await logger.divide();

    // Create cluster worker service
    await logger.log(localhost, "Creating cluster worker service");
    const clusterWorkerServiceSource = await servicer.createService({
      description: "Cluster daemon (worker only)",
      execStart: `/usr/local/bin/k3s agent --flannel-iface wgoverlay --token ${clusterToken} --server https://${
        clusterManagerNodeInNetwork[0].split("@")[1]
      }:6443`,
      destination: await tmpFiler.getPath("cluster-worker.service")
    });
    await logger.divide();

    // Upload cluster worker service
    await Promise.all(
      clusterWorkerNodesInNetwork.map(async ([node]) => {
        await logger.log(node, "Uploading cluster worker service");
        return await uploader.upload(
          clusterWorkerServiceSource,
          `${node}:/etc/systemd/system/cluster-worker.service`,
          true
        );
      })
    );
    await logger.divide();

    // Reload services on cluster worker nodes
    await Promise.all(
      clusterWorkerNodesInNetwork.map(async ([node]) => {
        await logger.log(node, "Reloading services");
        return await servicer.reloadServices(node);
      })
    );
    await logger.divide();

    // Enable cluster worker service on cluster worker nodes
    await Promise.all(
      clusterWorkerNodesInNetwork.map(async ([node]) => {
        await logger.log(node, "Enabling cluster-worker.service service");
        return await servicer.enableService(node, "cluster-worker.service");
      })
    );
    await logger.divide();

    // Get cluster config from cluster manager node
    await logger.log(clusterManagerNodeInNetwork[0], "Getting cluster config");
    await clusterer.waitForClusterConfig(clusterManagerNodeInNetwork[0]);
    const clusterConfig = await clusterer.getClusterConfig(
      clusterManagerNodeInNetwork[0],
      clusterManagerNodeInNetwork[2].split("@")[1]
    );

    // Log the data
    await logger.logData(
      "NETWORK_MANAGER_NODE_PUBLIC",
      networkManagerNodeInNetwork[2]
    );
    await logger.logData(
      "NETWORK_MANAGER_NODE_PRIVATE",
      networkManagerNodeInNetwork[0]
    );
    await logger.logData("NETWORK_TOKEN", networkToken);
    await logger.logData(
      "CLUSTER_MANAGER_NODE_PUBLIC",
      clusterManagerNodeInNetwork[2]
    );
    await logger.logData(
      "CLUSTER_MANAGER_NODE_PRIVATE",
      clusterManagerNodeInNetwork[0]
    );
    await logger.logData("CLUSTER_TOKEN", clusterToken);
    await logger.logData("CLUSTER_CONFIG", clusterConfig);
  }
});
