#!/usr/bin/env node

const Logger = require("../lib/logger");
const Pinger = require("../lib/pinger");
const SSHer = require("../lib/ssher");
const networkClusterManifestRaw = require("../data/networkClusterManifest.json");
const TmpFiler = require("../lib/tmpfiler");
const Downloader = require("../lib/downloader");
const OSer = require("../lib/oser");
const Uploader = require("../lib/uploader");
const Packager = require("../lib/packager");
const workloadClusterManifestRaw = require("../data/workloadClusterManifest.json");
const SELinuxer = require("../lib/selinuxer");
const Permissioner = require("../lib/permissioner");
const Kernelr = require("../lib/kernelr");
const Servicer = require("../lib/servicer");
const Cryptographer = require("../lib/cryptographer");
const IPer = require("../lib/iper");
const Modprober = require("../lib/modprober");
const Workloader = require("../lib/workloader");
const Hostnamer = require("../lib/hostnamer");
const Homer = require("../lib/homer");
const YAML = require("yaml");

new (require("../lib/noun"))({
  args: "<user@ip> [otherTargets...]",
  checker: commander =>
    commander.args[0] &&
    (commander.args[0].split("@")[0] && commander.args[0].split("@")[1]),
  action: async commander => {
    // Set up logger
    const logger = new Logger();
    const hostnamer = new Hostnamer();
    const localhost = hostnamer.getAddress();

    // Create provided public network cluster node data model
    // Here one could "plug in" the (`hetznersshkeys`, `hetznernodes`) or (`ctpfsshkeys`, `ctpfnodes`) actions)
    await logger.log(
      localhost,
      "Creating provided public network cluster node data model"
    );
    const providedPublicNetworkClusterManagerNode = commander.args[0];
    const providedPublicNetworkClusterWorkerNode = commander.args.filter(
      (_, index) => index !== 0
    );
    const providedPublicNetworkClusterNodes = [
      providedPublicNetworkClusterManagerNode,
      ...providedPublicNetworkClusterWorkerNode
    ];
    await logger.divide();

    // Wait for node connectivity
    const pinger = new Pinger();
    await Promise.all(
      providedPublicNetworkClusterNodes.map(async node => {
        await logger.log(
          node,
          "Waiting for public network cluster node connectivity"
        );
        return await pinger.waitForNode(`${node.split("@")[1]}:22`, 1000);
      })
    );
    await logger.divide();

    // Set up node access
    const nodeKeys = await Promise.all(
      providedPublicNetworkClusterNodes.map(async node => {
        await logger.log(node, "Setting up public network cluster node access");
        const isLocalSSHer = new SSHer(node);
        if (isLocalSSHer.isLocal) {
          return undefined;
        } else {
          const ssher = new SSHer(localhost);
          return ssher.getKey(node.split("@")[1]);
        }
      })
    );
    const localSSHer = new SSHer(localhost);
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
      providedPublicNetworkClusterNodes.map(async node => {
        await logger.log(
          node,
          "Getting public network cluster node's operating system"
        );
        const nodeOperatingSystem = await oser.getOS(node);
        return nodeOperatingSystems.push([node, nodeOperatingSystem]);
      })
    );
    await logger.divide();

    // Create public network cluster node data model
    await logger.log(
      localhost,
      "Creating public network cluster node data model"
    );
    const publicNetworkClusterManagerNode = [
      providedPublicNetworkClusterManagerNode,
      nodeOperatingSystems.find(
        ([operatingSystemNode]) =>
          operatingSystemNode === providedPublicNetworkClusterManagerNode
      )[1]
    ];
    const publicNetworkClusterWorkerNodes = providedPublicNetworkClusterWorkerNode.map(
      node => [
        node,
        nodeOperatingSystems.find(
          ([operatingSystemNode]) => operatingSystemNode === node
        )[1]
      ]
    );
    const publicNetworkClusterNodes = [
      publicNetworkClusterManagerNode,
      ...publicNetworkClusterWorkerNodes
    ];
    await logger.divide();

    // Set all network cluster file download sources
    const tmpFiler = new TmpFiler();
    const networkClusterFiles = await Promise.all(
      networkClusterManifestRaw.map(async fileType => [
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

    // Select the network cluster files to download
    const networkClusterFilesToDownload = networkClusterFiles
      .filter(
        target =>
          target[0] === "universal" ||
          (publicNetworkClusterNodes.find(([_, os]) => os === "debian") &&
            target[0] === "debian") ||
          (publicNetworkClusterNodes.find(([_, os]) => os === "centos") &&
            target[0] === "centos")
      )
      .filter(Boolean);

    // Download network cluster files
    const downloader = new Downloader();
    const networkClusterFilesToUpload = await Promise.all(
      networkClusterFilesToDownload
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

    // Set network cluster services to disable
    const networkClusterServicesToDisable = [
      "firewalld.service",
      "network-cluster-manager.service",
      "network-cluster-worker.service"
    ];

    // Disable network cluster services
    const servicer = new Servicer();
    await Promise.all(
      networkClusterServicesToDisable
        .map(service =>
          publicNetworkClusterNodes.map(([node]) => `${node}:${service}`)
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

    // Upload network cluster files
    const uploader = new Uploader();
    const networkClusterFilesToInstall = await Promise.all(
      publicNetworkClusterNodes
        .map(([node, nodeOperatingSystem]) =>
          networkClusterFilesToUpload
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

    // Re-order the network cluster files by nodes
    const networkClusterFilesToInstallByNodes = networkClusterFilesToInstall
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

    // Install network cluster files
    const packager = new Packager();
    const permissioner = new Permissioner();
    await Promise.all(
      networkClusterFilesToInstallByNodes.map(async ([node, files]) => {
        const universalFiles = files.filter(file => file[2] === "universal");
        const debianFiles = files.filter(file => file[2] === "debian");
        const centOSFiles = files.filter(file => file[2] === "centos");

        // The following ones can't be installed in parallel; `dpkg` and `rpm` use lock files
        if (universalFiles.length > 0) {
          for (let [name, destination, operatingSystem] of universalFiles) {
            await logger.log(
              node,
              `Setting permissions for ${name} (${operatingSystem})`
            );
            await permissioner.setPermissions(destination, "+x", true);
          }
        }
        if (debianFiles.length > 0) {
          for (let file of debianFiles) {
            await logger.log(node, `Installing ${file[0]} (${file[2]})`);
            await packager.installDebianPackage(file[1]);
          }
        }
        if (centOSFiles.length > 0) {
          for (let file of centOSFiles) {
            await logger.log(node, `Installing ${file[0]} (${file[2]})`);
            await packager.installCentOSPackage(file[1]);
          }
        }

        return true;
      })
    );
    await logger.divide();

    // Create network cluster kernel config
    const kernelr = new Kernelr();
    await logger.log(
      localhost,
      "Creating private network cluster node kernel config"
    );
    const networkClusterKernelConfig = await kernelr.createConfig(
      ["net.ipv4.ip_forward = 1", "net.ipv4.conf.all.proxy_arp = 1"],
      await tmpFiler.getPath("network-cluster.conf")
    );
    await logger.divide();

    // Upload network cluster kernel config
    await Promise.all(
      publicNetworkClusterNodes.map(async ([node]) => {
        await logger.log(
          node,
          "Uploading private network cluster node kernel config"
        );
        return await uploader.upload(
          networkClusterKernelConfig,
          `${node}:/etc/network-cluster.conf`,
          true
        );
      })
    );
    await logger.divide();

    // Apply network cluster kernel config
    await Promise.all(
      publicNetworkClusterNodes.map(async ([node]) => {
        await logger.log(
          node,
          "Applying private network cluster node kernel config"
        );
        return await kernelr.applyConfig(`${node}:/etc/network-cluster.conf`);
      })
    );
    await logger.divide();

    // Create network cluster token
    const cryptographer = new Cryptographer();
    await logger.log(localhost, "Creating private network cluster token");
    const privateNetworkClusterToken = await cryptographer.getRandomString(32);
    await logger.divide();

    // Create network cluster manager service
    await logger.log(
      localhost,
      "Creating private network cluster manager service"
    );
    const networkClusterManagerService = await servicer.createService({
      description: "Network cluster daemon (manager and worker)",
      execStart: `/bin/sh -c "/usr/local/bin/wireguard-go wgoverlay && /usr/local/bin/wesher --bind-addr ${
        publicNetworkClusterManagerNode[0].split("@")[1]
      } --cluster-key ${privateNetworkClusterToken}"`,
      environment: "WG_I_PREFER_BUGGY_USERSPACE_TO_POLISHED_KMOD=1",
      destination: await tmpFiler.getPath("network-cluster-manager.service")
    });
    await logger.divide();

    // Create network cluster worker service
    await logger.log(
      localhost,
      "Creating private network cluster worker node service"
    );
    const networkClusterWorkerServiceSource = await servicer.createService({
      description: "Network cluster daemon (worker only)",
      execStart: `/bin/sh -c "/usr/local/bin/wireguard-go wgoverlay && /usr/local/bin/wesher --cluster-key ${privateNetworkClusterToken} --join ${
        publicNetworkClusterManagerNode[0].split("@")[1]
      }"`,
      environment: "WG_I_PREFER_BUGGY_USERSPACE_TO_POLISHED_KMOD=1",
      destination: await tmpFiler.getPath("network-cluster-worker.service")
    });
    await logger.divide();

    // Upload network cluster manager service
    await logger.log(
      publicNetworkClusterManagerNode[0],
      "Uploading private network cluster manager node service"
    );
    await uploader.upload(
      networkClusterManagerService,
      `${
        publicNetworkClusterManagerNode[0]
      }:/etc/systemd/system/network-cluster-manager.service`,
      true
    );
    await logger.divide();

    // Upload network cluster worker service
    await Promise.all(
      publicNetworkClusterWorkerNodes.map(async ([node]) => {
        await logger.log(
          node,
          "Uploading private network cluster worker node service"
        );
        return uploader.upload(
          networkClusterWorkerServiceSource,
          `${node}:/etc/systemd/system/network-cluster-worker.service`,
          true
        );
      })
    );
    await logger.divide();

    // Reload services
    await Promise.all(
      publicNetworkClusterNodes.map(async ([node]) => {
        await logger.log(node, "Reloading services");
        return servicer.reloadServices(node);
      })
    );
    await logger.divide();

    // Enable network cluster manager service
    await logger.log(
      publicNetworkClusterManagerNode[0],
      "Enabling private network cluster manager service"
    );
    await servicer.enableService(
      publicNetworkClusterManagerNode[0],
      "network-cluster-manager.service"
    );
    await logger.divide();

    // Enable network cluster worker service
    await Promise.all(
      publicNetworkClusterWorkerNodes.map(async ([node]) => {
        await logger.log(
          node,
          "Enabling private network cluster worker node service"
        );
        return servicer.enableService(node, "network-cluster-worker.service");
      })
    );
    await logger.divide();

    // Get network cluster manager node
    const iper = new IPer();
    await logger.log(
      publicNetworkClusterManagerNode[0],
      "Getting private network cluster manager node"
    );
    await servicer.waitForService(
      publicNetworkClusterManagerNode[0],
      "network-cluster-manager.service",
      1000
    );
    await iper.waitForInterface(
      publicNetworkClusterManagerNode[0],
      "wgoverlay",
      1000
    );
    const privateNetworkClusterManagerNodeInterface = await iper.getInterface(
      publicNetworkClusterManagerNode[0],
      "wgoverlay"
    );
    const privateNetworkClusterManagerNode = [
      `${publicNetworkClusterManagerNode[0].split("@")[0]}@${
        privateNetworkClusterManagerNodeInterface.ip
      }`,
      publicNetworkClusterManagerNode[1],
      publicNetworkClusterManagerNode[0]
    ];
    await logger.divide();

    // Get network cluster worker nodes
    const privateNetworkClusterWorkerNodes = [];
    await Promise.all(
      publicNetworkClusterWorkerNodes.map(async ([node]) => {
        await logger.log(node, "Getting private network cluster worker node");
        await servicer.waitForService(
          node,
          "network-cluster-worker.service",
          1000
        );
        await iper.waitForInterface(node, "wgoverlay", 1000);
        const networkWorkerNodeInNetworkInterface = await iper.getInterface(
          node,
          "wgoverlay"
        );
        return privateNetworkClusterWorkerNodes.push([
          `${node.split("@")[0]}@${networkWorkerNodeInNetworkInterface.ip}`,
          nodeOperatingSystems.find(([osNode]) => node === osNode)[1],
          node
        ]);
      })
    );
    await logger.divide();

    // Create data model of private network cluster
    await logger.log(
      localhost,
      "Creating private network cluster node data model"
    );
    const privateNetworkClusterNodes = [
      privateNetworkClusterManagerNode,
      ...privateNetworkClusterWorkerNodes
    ];
    await logger.divide();

    // Wait for private network cluster node connectivity
    await Promise.all(
      privateNetworkClusterNodes.map(async ([node]) => {
        await logger.log(
          node,
          "Waiting for private network cluster node connectivity"
        );
        return await pinger.waitForNode(`${node.split("@")[1]}:22`, 1000);
      })
    );
    await logger.divide();

    // Set up network node access
    const privateNetworkClusterNodeKeys = await Promise.all(
      privateNetworkClusterNodes.map(async ([node]) => {
        await logger.log(
          node,
          "Setting up private network cluster node access"
        );
        const isLocalSSHer = new SSHer(node);
        if (isLocalSSHer.isLocal) {
          return undefined;
        } else {
          const ssher = new SSHer(localhost);
          return await ssher.getKey(node.split("@")[1]);
        }
      })
    );
    await localSSHer.trustKeys(
      privateNetworkClusterNodeKeys,
      `${homer.getHomeDirectory()}/.ssh/known_hosts`
    );
    await logger.divide();

    // Create data model of workload cluster
    await logger.log(localhost, "Creating workload cluster node data model");
    const workloadClusterManagerNodeInPrivateNetworkCluster = privateNetworkClusterManagerNode;
    const workloadClusterNodesInPrivateNetworkCluster = privateNetworkClusterNodes.filter(
      node => {
        const ssher1 = new SSHer(node[0]);
        const ssher2 = new SSHer(node[2]);
        return !ssher1.isLocal && !ssher2.isLocal;
      }
    );
    const workloadClusterWorkerNodesInPrivateNetworkCluster = workloadClusterNodesInPrivateNetworkCluster.filter(
      node =>
        privateNetworkClusterManagerNode[0] !== node[0] &&
        privateNetworkClusterManagerNode[2] !== node[2]
    );
    await logger.divide();

    // Set all workload cluster file download sources
    const workloadClusterFiles = await Promise.all(
      workloadClusterManifestRaw.map(async fileType => [
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

    // Select the workload cluster files to download
    const workloadClusterFilesToDownload = workloadClusterFiles
      .filter(
        target =>
          target[0] === "universal" ||
          (workloadClusterNodesInPrivateNetworkCluster.find(
            ([_, os]) => os === "debian"
          ) &&
            target[0] === "debian") ||
          (workloadClusterNodesInPrivateNetworkCluster.find(
            ([_, os]) => os === "centos"
          ) &&
            target[0] === "centos")
      )
      .filter(Boolean);

    // Download workload cluster files
    const workloadClusterFilesToUpload = await Promise.all(
      workloadClusterFilesToDownload
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

    // Set workload cluster services to disable
    const workloadClusterServicesToDisable = [
      "workload-cluster-manager.service",
      "workload-cluster-worker.service",
      "systemd-resolved.service"
    ];

    // Disable workload cluster services
    await Promise.all(
      workloadClusterServicesToDisable
        .map(service =>
          workloadClusterNodesInPrivateNetworkCluster.map(
            ([node]) => `${node}:${service}`
          )
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

    // Upload workload cluster files
    const workloadClusterFilesToInstall = await Promise.all(
      workloadClusterNodesInPrivateNetworkCluster
        .map(([node, nodeOperatingSystem]) =>
          workloadClusterFilesToUpload
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

    // Re-order the workload cluster files by nodes
    const workloadClusterFilesToInstallByNodes = workloadClusterFilesToInstall
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

    // Install workload cluster files
    await Promise.all(
      workloadClusterFilesToInstallByNodes.map(async ([node, files]) => {
        const universalFiles = files.filter(file => file[2] === "universal");
        const debianFiles = files.filter(file => file[2] === "debian");
        const centOSFiles = files.filter(file => file[2] === "centos");

        // The following ones can't be installed in parallel; `dpkg` and `rpm` use lock files
        if (universalFiles.length > 0) {
          for (let [name, destination, operatingSystem] of universalFiles) {
            await logger.log(
              node,
              `Setting permissions for ${name} (${operatingSystem})`
            );
            await permissioner.setPermissions(destination, "+x", true);
          }
        }
        if (debianFiles.length > 0) {
          for (let file of debianFiles) {
            await logger.log(node, `Installing ${file[0]} (${file[2]})`);
            await packager.installDebianPackage(file[1]);
          }
        }
        if (centOSFiles.length > 0) {
          for (let file of centOSFiles) {
            await logger.log(node, `Installing ${file[0]} (${file[2]})`);
            await packager.installCentOSPackage(file[1]);
          }
        }

        return true;
      })
    );
    await logger.divide();

    // Create workload cluster kernel config
    await logger.log(localhost, "Creating cluster kernel config");
    const workloadClusterKernelConfig = await kernelr.createConfig(
      [
        "net.bridge.bridge-nf-call-ip6tables = 1",
        "net.bridge.bridge-nf-call-iptables = 1"
      ],
      await tmpFiler.getPath("workload-cluster.conf")
    );
    await logger.divide();

    // Upload workload cluster kernel config
    await Promise.all(
      workloadClusterNodesInPrivateNetworkCluster.map(async ([node]) => {
        await logger.log(node, "Uploading workload cluster kernel config");
        return await uploader.upload(
          workloadClusterKernelConfig,
          `${node}:/etc/workload-cluster.conf`,
          true
        );
      })
    );
    await logger.divide();

    // Apply workload cluster kernel config
    await Promise.all(
      workloadClusterNodesInPrivateNetworkCluster.map(async ([node]) => {
        await logger.log(node, "Applying workload cluster kernel config");
        return await kernelr.applyConfig(`${node}:/etc/workload-cluster.conf`);
      })
    );
    await logger.divide();

    // Load br_netfilter module
    const modprober = new Modprober();
    await Promise.all(
      workloadClusterNodesInPrivateNetworkCluster.map(async ([node]) => {
        await logger.log(node, "Loading br_netfilter kernel module");
        return await modprober.modprobe(node, "br_netfilter");
      })
    );
    await logger.divide();

    // Set SELinux context
    const selinuxer = new SELinuxer();
    await Promise.all(
      workloadClusterNodesInPrivateNetworkCluster.map(async ([node]) => {
        await logger.log(node, "Setting SELinux context");
        await selinuxer.setenforce(node, "Permissive");
        await selinuxer.semanage(`${node}:/usr/local/bin/k3s`);
        return await selinuxer.restorecon(`${node}:/usr/local/bin/k3s`);
      })
    );
    await logger.divide();

    // Create workload cluster manager service
    await logger.log(localhost, "Creating cluster manager service");
    const workloadClusterManagerServiceSource = await servicer.createService({
      description: "Workload cluster daemon (manager only)",
      execStart: `/usr/local/bin/k3s server --no-deploy traefik --no-deploy servicelb --flannel-iface wgoverlay --tls-san ${
        workloadClusterManagerNodeInPrivateNetworkCluster[2].split("@")[1]
      }`,
      destination: await tmpFiler.getPath("workload-cluster-manager.service")
    });
    await logger.divide();

    // Upload workload cluster manager service
    await logger.log(
      workloadClusterManagerNodeInPrivateNetworkCluster[0],
      "Uploading workload cluster manager service"
    );
    await uploader.upload(
      workloadClusterManagerServiceSource,
      `${
        workloadClusterManagerNodeInPrivateNetworkCluster[0]
      }:/etc/systemd/system/workload-cluster-manager.service`,
      true
    );
    await logger.divide();

    // Upload workload cluster storage manifest
    await logger.log(
      workloadClusterManagerNodeInPrivateNetworkCluster[0],
      "Uploading workload cluster storage manifest"
    );
    await uploader.createDirectory(
      `${
        workloadClusterManagerNodeInPrivateNetworkCluster[0]
      }:/var/lib/rancher/k3s/server/manifests`,
      true
    );
    await uploader.upload(
      `${__dirname}/../data/storageClusterManifest.yaml`,
      `${
        workloadClusterManagerNodeInPrivateNetworkCluster[0]
      }:/var/lib/rancher/k3s/server/manifests/storageCluster.yaml`,
      true
    );
    await logger.divide();

    // Reload services on all workload cluster nodes
    await Promise.all(
      workloadClusterNodesInPrivateNetworkCluster.map(async ([node]) => {
        await logger.log(node, "Reloading services");
        return await servicer.reloadServices(node);
      })
    );
    await logger.divide();

    // Enable systemd-resolved service on all workload cluster nodes
    await Promise.all(
      workloadClusterNodesInPrivateNetworkCluster.map(async ([node]) => {
        await logger.log(node, "Enabling systemd-resolved.service service");
        return await servicer.enableService(node, "systemd-resolved.service");
      })
    );
    await logger.divide();

    // Enable workload cluster manager service on workload cluster manager node
    await logger.log(
      workloadClusterManagerNodeInPrivateNetworkCluster[0],
      "Enabling workload-cluster-manager.service service"
    );
    await servicer.enableService(
      workloadClusterManagerNodeInPrivateNetworkCluster[0],
      "workload-cluster-manager.service"
    );
    await logger.divide();

    // Get workload cluster token
    await logger.log(
      workloadClusterManagerNodeInPrivateNetworkCluster[0],
      "Getting workload cluster token"
    );
    const workloader = new Workloader();
    await servicer.waitForService(
      workloadClusterManagerNodeInPrivateNetworkCluster[0],
      "workload-cluster-manager.service",
      1000
    );
    await workloader.waitForClusterToken(
      workloadClusterManagerNodeInPrivateNetworkCluster[0],
      1000
    );
    const workloadClusterToken = await workloader.getClusterToken(
      workloadClusterManagerNodeInPrivateNetworkCluster[0]
    );
    await logger.divide();

    // Create workload cluster worker service
    await logger.log(localhost, "Creating workload cluster worker service");
    const workloadClusterWorkerServiceSource = await servicer.createService({
      description: "Workloda cluster daemon (worker only)",
      execStart: `/usr/local/bin/k3s agent --no-deploy traefik --no-deploy servicelb --flannel-iface wgoverlay --token ${workloadClusterToken} --server https://${
        workloadClusterManagerNodeInPrivateNetworkCluster[0].split("@")[1]
      }:6443`,
      destination: await tmpFiler.getPath("workload-cluster-worker.service")
    });
    await logger.divide();

    // Upload workload cluster worker service
    await Promise.all(
      workloadClusterWorkerNodesInPrivateNetworkCluster.map(async ([node]) => {
        await logger.log(node, "Uploading workload cluster worker service");
        return await uploader.upload(
          workloadClusterWorkerServiceSource,
          `${node}:/etc/systemd/system/workload-cluster-worker.service`,
          true
        );
      })
    );
    await logger.divide();

    // Reload services on workload cluster worker nodes
    await Promise.all(
      workloadClusterWorkerNodesInPrivateNetworkCluster.map(async ([node]) => {
        await logger.log(node, "Reloading services");
        return await servicer.reloadServices(node);
      })
    );
    await logger.divide();

    // Enable workload cluster worker service on workload cluster worker nodes
    await Promise.all(
      workloadClusterWorkerNodesInPrivateNetworkCluster.map(async ([node]) => {
        await logger.log(
          node,
          "Enabling workload-cluster-worker.service service"
        );
        return await servicer.enableService(
          node,
          "workload-cluster-worker.service"
        );
      })
    );
    await logger.divide();

    // Get workload cluster config from workload cluster manager node
    await logger.log(
      workloadClusterManagerNodeInPrivateNetworkCluster[0],
      "Getting workload cluster config"
    );
    await workloader.waitForClusterConfig(
      workloadClusterManagerNodeInPrivateNetworkCluster[0]
    );
    const workloadClusterConfig = await workloader.getClusterConfig(
      workloadClusterManagerNodeInPrivateNetworkCluster[0],
      workloadClusterManagerNodeInPrivateNetworkCluster[2].split("@")[1]
    );
    await logger.divide();

    // Log the data
    await logger.log(
      localhost,
      {
        privateNetworkClusterManagerNodePublicAccess:
          privateNetworkClusterManagerNode[2],
        privateNetworkClusterManagerNodePrivateAccess:
          privateNetworkClusterManagerNode[0],
        privateNetworkClusterToken: privateNetworkClusterToken,
        workloadClusterManagerNodePublicAccess:
          workloadClusterManagerNodeInPrivateNetworkCluster[2],
        workloadClusterManagerNodePrivateAccess:
          workloadClusterManagerNodeInPrivateNetworkCluster[0],
        workloadClusterToken: workloadClusterToken
      },
      "data",
      "Successfully applied clusters' variables"
    );
    await logger.log(
      localhost,
      YAML.parse(workloadClusterConfig),
      "data",
      "Successfully applied workload cluster's config"
    );
  }
});
