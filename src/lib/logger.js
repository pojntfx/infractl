module.exports = class {
  async log(destination, message, messageType) {
    console.log(
      `${new Date().getTime()} [${
        messageType === "done"
          ? "DONE"
          : messageType === "error"
          ? "ERROR"
          : "INFO"
      }] ${`${message} `.padEnd(60, ".")} ${`${destination}`}`
    );
  }

  async logData(name, value) {
    console.log(`${name}="${value}"`);
  }

  async divide() {
    console.log("");
  }
};
