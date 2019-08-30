const stopAndDeleteService = require("../stopAndDeleteService");

module.exports = async target =>
  stopAndDeleteService({ target, name: "wesher-worker.service" });
