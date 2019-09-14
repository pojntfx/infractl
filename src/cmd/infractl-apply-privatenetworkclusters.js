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
const Permissioner = require("../lib/permissioner");
const Kernelr = require("../lib/kernelr");
const Servicer = require("../lib/servicer");
const Cryptographer = require("../lib/cryptographer");
const IPer = require("../lib/iper");
const Hostnamer = require("../lib/hostnamer");
const Homer = require("../lib/homer");

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
      execStart: `/bin/sh -c "/usr/local/bin/wireguard-go wgoverlay && /usr/local/bin/wesher --no-etc-hosts --bind-addr ${
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
      execStart: `/bin/sh -c "/usr/local/bin/wireguard-go wgoverlay && /usr/local/bin/wesher --no-etc-hosts --cluster-key ${privateNetworkClusterToken} --join ${
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

    // Log the data
    await logger.log(
      localhost,
      {
        privateNetworkClusterManagerNodePublicAccess:
          privateNetworkClusterManagerNode[2],
        privateNetworkClusterManagerNodePrivateAccess:
          privateNetworkClusterManagerNode[0],
        privateNetworkClusterToken: privateNetworkClusterToken
      },
      "data",
      "Successfully applied private network clusters' variables"
    );
  }
});
