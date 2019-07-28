const Rsync = require("rsync");

module.exports = async ({ source, destination, permissions, reUpload }) => {
  const rsync = new Rsync();
  rsync
    .shell("ssh")
    .set(reUpload ? "ignore-times" : undefined)
    .chmod(permissions)
    .source(source)
    .destination(destination);
  return rsync.execute();
};
