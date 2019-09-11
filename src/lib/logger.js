const YAML = require("yaml");

module.exports = class {
  async log(destination, message, messageType, dataName) {
    messageType === "data"
      ? console.log(
          `${new Date().getTime()} [DATA] ${dataName}: ${`\n\n${YAML.stringify(
            message
          )}\n` + ``.padEnd(60, ".")} ${`${destination}`}`
        )
      : console.log(
          `${new Date().getTime()} [${
            messageType === "done"
              ? "DONE"
              : messageType === "error"
              ? "ERROR"
              : "INFO"
          }] ${`${message} `.padEnd(60, ".")} ${`${destination}`}`
        );
  }

  async divide() {
    console.log("");
  }
};
