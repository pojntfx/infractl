# Felicitas Pojtinger's InfraCTL TODO

- Enable usage of Kubernetes as context provider
- Enable usage of KubeVirt as keys provider (with `ConfigMaps`)
- Enable usage of KubeVirt as location provider (a single hard-coded location for now)
- Enable usage of KubeVirt as type provider (a single hard-coded type for now)
- Enable usage of KubeVirt as OS provider (from `registry.gitlab.com/pojntfx/pojntfx/${OS_NAME}-kubevirt-container-disk:${OS_VERSION}`)
- Enable usage of KubeVirt as node provider (from the `VirtualMachine` and `VirtualMachineInstance` CRDs)
- Add flags to KubeVirt node provider that allow for the configuration of open ports
- Use different RPM/DEB packages for Debian 10, Ubuntu 18.04, CentOS 8 and Fedora 31
- Enable usage of ARMHF for Private Network Clusters (for Raspberry Pi)
