const fs = require("fs");
const SSHer = require("./ssher");

module.exports = class {
  async createConfig({ subnet, netmask }, range, destination) {
    return new Promise(resolve =>
      fs.writeFile(
        destination,
        `subnet ${subnet} netmask ${netmask} {
        range ${range.join(" ")};
}\n`,
        () => resolve(destination)
      )
    );
  }

  async createLeaseFile(destination) {
    const ssher = new SSHer(destination);
    return await ssher.touch(`${destination}:/var/lib/dhcp/dhcpd.leases`, true);
  }
};
