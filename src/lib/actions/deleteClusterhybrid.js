const stopAndDeleteService = require("../stopAndDeleteService");

module.exports = async target =>
  stopAndDeleteService({ target, name: "k3s-hybrid.service" });
