const Verb = require("./verb");
const commander = require("commander");

module.exports = class {
  constructor(version, description, commands) {
    version && commander.version(version);
    description && commander.description(description);

    commands && new Verb(commands);
  }
};
