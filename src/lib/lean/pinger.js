const tcping = require("tcp-ping");
const SSHer = require("./ssher");

module.exports = class {
  async ping(destination) {
    const ssher = new SSHer(`${process.env.USER}@${destination.split(":")[0]}`);
    if (ssher.isLocal) {
      return true;
    } else {
      return new Promise(resolve =>
        tcping.probe(
          `${destination.split(":")[0]}`,
          `${destination.split(":")[1]}`,
          (_, available) => resolve(available)
        )
      );
    }
  }

  async waitForNode(destination, interval) {
    const nodeIsAvailable = await this.ping(destination);
    return new Promise(resolve => {
      if (nodeIsAvailable) {
        resolve(true);
      } else {
        setTimeout(
          () =>
            this.waitForNode(destination, interval).then(() => resolve(true)),
          interval
        );
      }
    });
  }
};
