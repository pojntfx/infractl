const download = require("download");
const fs = require("fs");

module.exports = class {
  async download(source, destination) {
    return new Promise(resolve =>
      download(source).then(data =>
        fs.writeFile(destination, data, () => resolve(destination))
      )
    );
  }
};
