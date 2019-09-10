const Verb = require("./verb");
const commander = require("commander");

module.exports = class {
  constructor(version, commands) {
    version && commander.version(version);

    commands && new Verb(commands);
  }
};
