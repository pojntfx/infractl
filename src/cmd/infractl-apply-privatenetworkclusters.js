#!/usr/bin/env node

const Logger = require("../lib/logger");
const Pinger = require("../lib/pinger");
const SSHer = require("../lib/ssher");
const type2Files = require("../data/type2NetworkClusterManifest.json");
const type3Files = require("../data/type3NetworkClusterManifest.json");
const TmpFiler = require("../lib/tmpfiler");
const Downloader = require("../lib/downloader");
const OSer = require("../lib/oser");
const Uploader = require("../lib/uploader");
const Packager = require("../lib/packager");
const Permissioner = require("../lib/permissioner");
const DHCPer = require("../lib/dhcper");
const Kernelr = require("../lib/kernelr");
const Servicer = require("../lib/servicer");
const Cryptographer = require("../lib/cryptographer");
const IPer = require("../lib/iper");
const Hostnamer = require("../lib/hostnamer");
const Homer = require("../lib/homer");

new (require("../lib/noun"))({
  args:
    "<user@manager-node-ip|user@manager-node-public-ip/manager-node-private-ip|manager-node-ip> [user@worker-node-ip|user@worker-node-public-ip/worker-node-private-ip] [otherWorkerNodes...] [$(whoami)@$(hostname)|$(whoami)@$(hostname)/node-private-ip]",
  options: [
    [
      "-t, --private-network-cluster-type [2|3]",
      "Private network clusters' type (OSI layer) (by default 3)"
    ],
    [
      "-k, --token [token]",
      "Private network cluster's token (if specified, provide just the manager node's ip without the it's user, but specify the worker nodes' users)"
    ]
  ],
  checker: commander =>
    commander.args[0]
      ? commander.token
        ? // Worker only install
          commander.args[0] &&
          commander.args[1] &&
          (!commander.args[0].split("@")[1] && // There should be no username in the manager node address
          commander.args[1].split("@")[0] && // There should be a username in the worker nodes' address
            commander.args[1].split("@")[1])
        : commander.args[0] && commander.args[1]
        ? // Manager and worker install
          commander.args[0].split("@")[0] &&
          commander.args[0].split("@")[1] &&
          (commander.args[1].split("@")[0] && commander.args[1].split("@")[1])
        : // Manager only install
          commander.args[0].split("@")[0] && commander.args[0].split("@")[1]
      : false,
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
    const isType2 = commander.privateNetworkClusterType === "2";
    const clusterToken = commander.token;
    const isManagerOnly =
      !clusterToken &&
      !commander.args[1] &&
      commander.args[0].split("@")[0] &&
      commander.args[0].split("@")[1];
    const serviceSuffix =
      commander.privateNetworkClusterType === "2" ? "-type-2" : "-type-3";
    const bindIps = commander.args.map(node =>
      node.split("@")[1]
        ? node.split("/")[1]
          ? [node.split("/")[0], node.split("/")[1]]
          : [node, false]
        : [node, false]
    );
    const providedManagerNode = commander.args[0].split("/")[0];
    const providedWorkerNodes = isManagerOnly
      ? []
      : commander.args
          .filter((_, index) => index !== 0)
          .map(node => node.split("/")[0]);
    const allProvidedNodes =
      clusterToken && !isManagerOnly
        ? providedWorkerNodes
        : [providedManagerNode, ...providedWorkerNodes];
    await logger.divide();

    // Wait for node connectivity
    const pinger = new Pinger();
    await Promise.all(
      allProvidedNodes.map(async node => {
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
      allProvidedNodes.map(async node => {
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
      allProvidedNodes.map(async node => {
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
    const publicManagerNode =
      clusterToken && !isManagerOnly
        ? [providedManagerNode]
        : [
            providedManagerNode,
            nodeOperatingSystems.find(
              ([operatingSystemNode]) =>
                operatingSystemNode === providedManagerNode
            )[1]
          ];
    const publicWorkerNodes = providedWorkerNodes.map(node => [
      node,
      nodeOperatingSystems.find(
        ([operatingSystemNode]) => operatingSystemNode === node
      )[1]
    ]);
    const allPublicNodes =
      clusterToken && !isManagerOnly
        ? publicWorkerNodes
        : [publicManagerNode, ...publicWorkerNodes];
    await logger.divide();

    // Set all network cluster file download sources
    const tmpFiler = new TmpFiler();
    const files = await Promise.all(
      (isType2 ? type2Files : type3Files).map(async fileType => [
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
    const filesToDownload = files
      .filter(
        target =>
          target[0] === "universal" ||
          (allPublicNodes.find(([_, os]) => os === "debian") &&
            target[0] === "debian") ||
          (allPublicNodes.find(([_, os]) => os === "centos") &&
            target[0] === "centos")
      )
      .filter(Boolean);

    // Download network cluster files
    const downloader = new Downloader();
    const filesToUpload = await Promise.all(
      filesToDownload
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
    const servicesToDisable = [
      ...(isType2 ? ["dhcpd", "isc-dhcp-server", "isc-dhcp-server6"] : []),
      "firewalld.service",
      `private-network-cluster-manager${serviceSuffix}.service`,
      `private-network-cluster-worker${serviceSuffix}.service`
    ];

    // Disable network cluster services
    const servicer = new Servicer();
    await Promise.all(
      servicesToDisable
        .map(service => allPublicNodes.map(([node]) => `${node}:${service}`))
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
    const filesToInstall = await Promise.all(
      allPublicNodes
        .map(([node, nodeOperatingSystem]) =>
          filesToUpload
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
    const filesToInstallByNodes = filesToInstall
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
      filesToInstallByNodes.map(async ([node, files]) => {
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

    if ((isType2 && !clusterToken) || isManagerOnly) {
      // Create network cluster dhcp config
      const dhcper = new DHCPer();
      await logger.log(
        localhost,
        "Creating private network cluster dhcp config"
      );
      const dhcpConfig = await dhcper.createConfig(
        {
          subnet: "192.168.1.0",
          netmask: "255.255.255.0"
        },
        ["192.168.1.10", "192.168.1.100"],
        await tmpFiler.getPath("dhcpd.conf")
      );

      // Upload network cluster kernel config
      await logger.log(
        publicManagerNode[0],
        "Uploading private network cluster dhcp config"
      );
      await uploader.upload(
        dhcpConfig,
        `${publicManagerNode[0]}:/etc/dhcp/dhcpd.conf`,
        true
      );
      await logger.divide();

      // Create network cluster dhcp lease file
      await logger.log(
        publicManagerNode[0],
        "Creating private network cluster dhcp lease file"
      );
      await dhcper.createLeaseFile(publicManagerNode[0]);
      await logger.divide();
    }

    // Create network cluster kernel config
    const kernelr = new Kernelr();
    await logger.log(
      localhost,
      "Creating private network cluster node kernel config"
    );
    const kernelConfig = await kernelr.createConfig(
      ["net.ipv4.ip_forward = 1", "net.ipv4.conf.all.proxy_arp = 1"],
      await tmpFiler.getPath("network-cluster.conf")
    );
    await logger.divide();

    // Upload network cluster kernel config
    await Promise.all(
      allPublicNodes.map(async ([node]) => {
        await logger.log(
          node,
          "Uploading private network cluster node kernel config"
        );
        return await uploader.upload(
          kernelConfig,
          `${node}:/etc/network-cluster.conf`,
          true
        );
      })
    );
    await logger.divide();

    // Apply network cluster kernel config
    await Promise.all(
      allPublicNodes.map(async ([node]) => {
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
    await logger.log(
      localhost,
      `${clusterToken ? "Setting" : "Creating"} private network cluster token`
    );
    const token = clusterToken
      ? clusterToken
      : await cryptographer.getRandomString(32);
    await logger.divide();

    if (!clusterToken || isManagerOnly) {
      // Create network cluster manager service
      await logger.log(
        localhost,
        "Creating private network cluster manager service"
      );
      const managerServiceSource = isType2
        ? await servicer.createService({
            description: "Network cluster daemon (manager and worker)",
            execStart: `/bin/sh -c "/usr/local/bin/supernode -l 9090 -v & /usr/local/bin/edge -d edge0 -r -a 192.168.1.1 -c privatenetworkcluster -k ${token} -l localhost:9090 -v && /usr/sbin/dhcpd -f edge0"`,
            destination: await tmpFiler.getPath(
              `private-network-cluster-manager${serviceSuffix}.service`
            )
          })
        : await servicer.createService({
            description: "Network cluster daemon (manager and worker)",
            execStart: `/bin/sh -c "/usr/local/bin/wireguard-go wgoverlay && /usr/local/bin/wesher --interface wgoverlay --no-etc-hosts --bind-addr ${bindIps.find(
              ip => ip[0] === publicManagerNode[0]
            )[1] ||
              publicManagerNode[0].split("@")[1]} --cluster-key ${token}"`,
            environment: "WG_I_PREFER_BUGGY_USERSPACE_TO_POLISHED_KMOD=1",
            destination: await tmpFiler.getPath(
              `private-network-cluster-manager${serviceSuffix}.service`
            )
          });

      // Upload network cluster manager service
      await logger.log(
        publicManagerNode[0],
        "Uploading private network cluster manager node service"
      );
      await uploader.upload(
        managerServiceSource,
        `${
          publicManagerNode[0]
        }:/etc/systemd/system/private-network-cluster-manager${serviceSuffix}.service`,
        true
      );
      await logger.divide();
    }

    if (!isManagerOnly) {
      // Create network cluster worker services
      const workerServiceSources = isType2
        ? await servicer.createService({
            description: "Network cluster daemon (worker only)",
            execStart: `/bin/sh -c "/usr/local/bin/edge -d edge0 -r -a dhcp:0.0.0.0 -c privatenetworkcluster -k ${token} -l ${
              clusterToken && !isManagerOnly
                ? publicManagerNode[0]
                : bindIps.find(ip => ip[0] === publicManagerNode[0])[1] ||
                  publicManagerNode[0].split("@")[1]
            }:9090 -v -m $(echo $(cat /etc/machine-id)|md5sum|sed 's/^\\(..\\)\\(..\\)\\(..\\)\\(..\\)\\(..\\).*$/02:\\1:\\2:\\3:\\4:\\5/') && pkill -9 dhclient; /sbin/dhclient edge0; tail -f /dev/null"`,
            destination: await tmpFiler.getPath(
              `private-network-cluster-worker${serviceSuffix}.service`
            )
          })
        : await Promise.all(
            publicWorkerNodes.map(async ([node]) => {
              await logger.log(
                node,
                "Creating private network cluster worker node service"
              );
              return await servicer.createService({
                description: "Network cluster daemon (worker only)",
                execStart: `/bin/sh -c "/usr/local/bin/wireguard-go wgoverlay && /usr/local/bin/wesher --interface wgoverlay --no-etc-hosts --bind-addr ${bindIps.find(
                  ip => ip[0] === node
                )[1] || node.split("@")[1]} --cluster-key ${token} --join ${
                  clusterToken && !isManagerOnly
                    ? publicManagerNode[0]
                    : bindIps.find(ip => ip[0] === publicManagerNode[0])[1] ||
                      publicManagerNode[0].split("@")[1]
                }"`,
                environment: "WG_I_PREFER_BUGGY_USERSPACE_TO_POLISHED_KMOD=1",
                destination: await tmpFiler.getPath(
                  `private-network-cluster-worker${serviceSuffix}.service-${node}`
                )
              });
            })
          );

      // Upload network cluster worker service
      await Promise.all(
        publicWorkerNodes.map(async ([node]) => {
          await logger.log(
            node,
            "Uploading private network cluster worker node service"
          );
          return uploader.upload(
            isType2
              ? workerServiceSources
              : workerServiceSources.find(
                  source =>
                    source.split(
                      `private-network-cluster-worker${serviceSuffix}.service-`
                    )[1] === node
                ),
            `${node}:/etc/systemd/system/private-network-cluster-worker${serviceSuffix}.service`,
            true
          );
        })
      );
      await logger.divide();
    }

    // Reload services
    await Promise.all(
      allPublicNodes.map(async ([node]) => {
        await logger.log(node, "Reloading services");
        return servicer.reloadServices(node);
      })
    );
    await logger.divide();

    if (!clusterToken || isManagerOnly) {
      // Enable network cluster manager service
      await logger.log(
        publicManagerNode[0],
        "Enabling private network cluster manager service"
      );
      await servicer.enableService(
        publicManagerNode[0],
        `private-network-cluster-manager${serviceSuffix}.service`
      );
      await logger.divide();
    }

    if (!isManagerOnly) {
      // Enable network cluster worker service
      await Promise.all(
        publicWorkerNodes.map(async ([node]) => {
          await logger.log(
            node,
            "Enabling private network cluster worker node service"
          );
          return servicer.enableService(
            node,
            `private-network-cluster-worker${serviceSuffix}.service`
          );
        })
      );
      await logger.divide();
    }

    // Get network cluster worker nodes
    const iper = new IPer();
    if (!isManagerOnly) {
      const privateWorkerNodes = [];
      await Promise.all(
        publicWorkerNodes.map(async ([node]) => {
          await logger.log(node, "Getting private network cluster worker node");
          await servicer.waitForService(
            node,
            `private-network-cluster-worker${serviceSuffix}.service`,
            1000
          );
          await iper.waitForInterface(
            node,
            isType2 ? "edge0" : "wgoverlay",
            1000
          );
          const networkWorkerNodeInNetworkInterface = await iper.getInterface(
            node,
            isType2 ? "edge0" : "wgoverlay"
          );
          return privateWorkerNodes.push([
            `${node.split("@")[0]}@${networkWorkerNodeInNetworkInterface.ip}`,
            nodeOperatingSystems.find(([osNode]) => node === osNode)[1],
            node
          ]);
        })
      );
      await logger.divide();
    }

    if (!clusterToken || isManagerOnly) {
      // Get network cluster manager node
      await logger.log(
        publicManagerNode[0],
        "Getting private network cluster manager node"
      );
      await servicer.waitForService(
        publicManagerNode[0],
        `private-network-cluster-manager${serviceSuffix}.service`,
        1000
      );
      await iper.waitForInterface(
        publicManagerNode[0],
        isType2 ? "edge0" : "wgoverlay",
        1000
      );
      const privateManagerNodeInterface = await iper.getInterface(
        publicManagerNode[0],
        isType2 ? "edge0" : "wgoverlay"
      );
      const privateManagerNode = [
        `${publicManagerNode[0].split("@")[0]}@${
          privateManagerNodeInterface.ip
        }`,
        publicManagerNode[1],
        publicManagerNode[0]
      ];
      await logger.divide();

      // Log the data
      await logger.log(
        localhost,
        {
          managerNode: {
            access: {
              public: privateManagerNode[2],
              private: privateManagerNode[0]
            }
          },
          token
        },
        "data",
        "Successfully applied private network clusters' variables"
      );
    } else {
      // Log the data
      await logger.log(
        localhost,
        {
          managerNode: {
            ips: {
              public: publicManagerNode[0]
            }
          },
          token
        },
        "data",
        "Successfully applied private network clusters' variables"
      );
    }
  }
});
