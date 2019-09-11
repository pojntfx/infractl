const YAML = require("yaml");

module.exports = class {
  async log(destination, message, messageType, dataName) {
    messageType === "data"
      ? console.log(
          `${new Date().getTime()} [DATA] ${dataName}:\n${YAML.stringify(
            message
          )}${`${new Date().getTime()} [DATA]`
            .split("")
            .map(_ => ".")
            .join("")}.${"".padEnd(60, ".")} ${destination}`
        )
      : console.log(
          `${new Date().getTime()} [${
            messageType === "done"
              ? "DONE"
              : messageType === "error"
              ? "WARN"
              : "INFO"
          }] ${`${message} `.padEnd(60, ".")} ${destination}`
        );
  }

  async divide() {
    console.log("");
  }
};
