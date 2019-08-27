const download = require("download");
const fs = require("fs");

const downloadAndSave = async (source, destination) =>
  download(source).then(data => {
    fs.writeFileSync(destination, data);
  });

module.exports = async ({ source, destination, reDownload }) => {
  reDownload === "true"
    ? await downloadAndSave(source, destination)
    : !reDownload &&
      (!fs.existsSync(destination) &&
        (await downloadAndSave(source, destination)));
  return destination;
};
