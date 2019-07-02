const commander = require("commander");
const asVerb = require("./asVerb");

module.exports = async (version, commands) => {
  commander.version(version);
  return await asVerb(commands);
};
