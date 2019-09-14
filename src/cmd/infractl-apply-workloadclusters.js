#!/usr/bin/env node

const Logger = require("../lib/logger");
const Pinger = require("../lib/pinger");
const SSHer = require("../lib/ssher");
const TmpFiler = require("../lib/tmpfiler");
const Downloader = require("../lib/downloader");
const OSer = require("../lib/oser");
const Uploader = require("../lib/uploader");
const Packager = require("../lib/packager");
const workloadClusterManifestRaw = require("../data/workloadClusterManifest.json");
const Issuer = require("../lib/issuer");
const SELinuxer = require("../lib/selinuxer");
const Permissioner = require("../lib/permissioner");
const Kernelr = require("../lib/kernelr");
const Servicer = require("../lib/servicer");
const Modprober = require("../lib/modprober");
const Workloader = require("../lib/workloader");
const Hostnamer = require("../lib/hostnamer");
const Homer = require("../lib/homer");
const YAML = require("yaml");

new (require("../lib/noun"))({
  args: "<user@ip> [otherTargets...]",
  options: [
    [
      "-e, --email [user@provider]",
      "Email to use for Let's Encrypt certificate issuers (optional, if not provided they won't be deployed)"
    ],
    [
      "-m, --additional-manager-ip [ip]",
      "Additional IP of the manager node to use in the cluster config (if not, the target IP will be used, which might only be reachable from within the private network cluster depending on your setup)"
    ]
  ],
  checker: commander =>
    commander.args[0] &&
    (commander.args[0].split("@")[0] && commander.args[0].split("@")[1]),
  action: async commander => {
    // Set up logger
    const logger = new Logger();
    const hostnamer = new Hostnamer();
    const localhost = hostnamer.getAddress();

    // Create data model of provided network cluster
    await logger.log(
      localhost,
      "Creating provided network cluster node data model"
    );
    const providedNetworkClusterManagerNode = commander.args[0];
    const providedNetworkClusterWorkerNodes = commander.args.filter(
      (_, index) => index !== 0
    );
    const providedNetworkClusterNodes = [
      providedNetworkClusterManagerNode,
      ...providedNetworkClusterWorkerNodes
    ];
    await logger.divide();

    // Wait for provided network cluster node connectivity
    const pinger = new Pinger();
    await Promise.all(
      providedNetworkClusterNodes.map(async node => {
        await logger.log(
          node,
          "Waiting for provided network cluster node connectivity"
        );
        return await pinger.waitForNode(`${node.split("@")[1]}:22`, 1000);
      })
    );
    await logger.divide();

    // Set up network node access
    const homer = new Homer();
    const providedNetworkClusterNodeKeys = await Promise.all(
      providedNetworkClusterNodes.map(async node => {
        await logger.log(
          node,
          "Setting up provided network cluster node access"
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
    const localSSHer = new SSHer(localhost);
    await localSSHer.trustKeys(
      providedNetworkClusterNodeKeys,
      `${homer.getHomeDirectory()}/.ssh/known_hosts`
    );
    await logger.divide();

    // Get nodes' operating system
    const oser = new OSer();
    const nodeOperatingSystems = [];
    await Promise.all(
      providedNetworkClusterNodes.map(async node => {
        await logger.log(
          node,
          "Getting provided network cluster node's operating system"
        );
        const nodeOperatingSystem = await oser.getOS(node);
        return nodeOperatingSystems.push([node, nodeOperatingSystem]);
      })
    );
    await logger.divide();

    // Create data model of workload cluster
    await logger.log(localhost, "Creating workload cluster node data model");
    const workloadClusterManagerNodeInPrivateNetworkCluster = [
      providedNetworkClusterManagerNode,
      nodeOperatingSystems.find(
        ([operatingSystemNode]) =>
          operatingSystemNode === providedNetworkClusterManagerNode
      )[1]
    ];
    const workloadClusterNodesInPrivateNetworkCluster = providedNetworkClusterNodes.map(
      node => [
        node,
        nodeOperatingSystems.find(
          ([operatingSystemNode]) => operatingSystemNode === node
        )[1]
      ]
    );
    const workloadClusterWorkerNodesInPrivateNetworkCluster = workloadClusterNodesInPrivateNetworkCluster.filter(
      node => providedNetworkClusterManagerNode[0] !== node[0]
    );
    await logger.divide();

    // Set all workload cluster file download sources
    const tmpFiler = new TmpFiler();
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
    const downloader = new Downloader();
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
      "systemd-resolved.service",
      "iscsid.service"
    ];

    // Disable workload cluster services
    const servicer = new Servicer();
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
    const uploader = new Uploader();
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
    const permissioner = new Permissioner();
    const packager = new Packager();
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
    const kernelr = new Kernelr();
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
      description: "Workload cluster daemon (manager and worker)",
      execStart: `/usr/local/bin/k3s server --no-deploy traefik --no-deploy servicelb --flannel-iface wgoverlay --tls-san ${
        commander.additionalManagerIp
          ? commander.additionalManagerIp
          : workloadClusterManagerNodeInPrivateNetworkCluster[0].split("@")[1]
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

    // Create remote manifests and charts directory
    await logger.log(
      workloadClusterManagerNodeInPrivateNetworkCluster[0],
      "Creating remote manifests and charts directory"
    );
    await uploader.createDirectory(
      `${
        workloadClusterManagerNodeInPrivateNetworkCluster[0]
      }:/var/lib/rancher/k3s/server/manifests`,
      true
    );
    // Upload workload cluster storage chart
    await logger.log(
      workloadClusterManagerNodeInPrivateNetworkCluster[0],
      "Uploading workload cluster storage chart"
    );
    await uploader.upload(
      `${__dirname}/../data/openEBSChart.yaml`,
      `${
        workloadClusterManagerNodeInPrivateNetworkCluster[0]
      }:/var/lib/rancher/k3s/server/manifests/openebs.yaml`,
      true
    );
    // Upload workload cluster ingress chart
    await logger.log(
      workloadClusterManagerNodeInPrivateNetworkCluster[0],
      "Uploading workload cluster ingress chart"
    );
    await uploader.upload(
      `${__dirname}/../data/nginxIngressChart.yaml`,
      `${
        workloadClusterManagerNodeInPrivateNetworkCluster[0]
      }:/var/lib/rancher/k3s/server/manifests/nginxingress.yaml`,
      true
    );
    // Upload workload cluster certificate manager chart
    await logger.log(
      workloadClusterManagerNodeInPrivateNetworkCluster[0],
      "Uploading workload cluster certificate manager chart"
    );
    await uploader.upload(
      `${__dirname}/../data/certManagerChart.yaml`,
      `${
        workloadClusterManagerNodeInPrivateNetworkCluster[0]
      }:/var/lib/rancher/k3s/server/manifests/certmanager.yaml`,
      true
    );
    // Upload workload cluster certificate issuer manifest
    if (
      commander.email &&
      (commander.email.split("@")[0] && commander.email.split("@")[1])
    ) {
      await logger.log(
        localhost,
        "Creating workload cluster certificate issuer manifest"
      );
      const issuer = new Issuer();
      const issuersManifestSource = await issuer.createIssuers(
        `${localhost}:${__dirname}/../data/certIssuersManifest.yaml`,
        await tmpFiler.getPath("certIssuersManifest.yaml"),
        commander.email
      );
      await logger.log(
        workloadClusterManagerNodeInPrivateNetworkCluster[0],
        "Uploading workload cluster certificate issuer manifest"
      );
      await uploader.upload(
        issuersManifestSource,
        `${
          workloadClusterManagerNodeInPrivateNetworkCluster[0]
        }:/var/lib/rancher/k3s/server/manifests/certissuers.yaml`,
        true
      );
    }
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

    // Enable iscsid service on all workload cluster nodes
    await Promise.all(
      workloadClusterNodesInPrivateNetworkCluster.map(async ([node]) => {
        await logger.log(node, "Enabling iscsid.service service");
        return await servicer.enableService(node, "iscsid.service");
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
      execStart: `/usr/local/bin/k3s agent --flannel-iface wgoverlay --token ${workloadClusterToken} --server https://${
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
      commander.additionalManagerIp
        ? commander.additionalManagerIp
        : workloadClusterManagerNodeInPrivateNetworkCluster[0].split("@")[1]
    );
    await logger.divide();

    // Log the data
    await logger.log(
      localhost,
      {
        workloadClusterManagerNodePublicAccess: commander.additionalManagerIp
          ? commander.additionalManagerIp
          : workloadClusterManagerNodeInPrivateNetworkCluster[0].split("@")[1],
        workloadClusterManagerNodePrivateAccess: workloadClusterManagerNodeInPrivateNetworkCluster[1].split(
          "@"
        )[1],
        workloadClusterToken
      },
      "data",
      "Successfully applied workload clusters' variables"
    );
    await logger.log(
      localhost,
      YAML.parse(workloadClusterConfig),
      "data",
      "Successfully applied workload cluster's config"
    );
  }
});
