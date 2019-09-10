const commander = require("commander");

module.exports = class {
  constructor(commands) {
    commands.forEach(command => {
      commander.command(command[0], command[1]).alias(command[2]);
    });

    commander.parse(process.argv);
  }
};
