module.exports = class {
  async log(destination, message, done) {
    console.log(
      `${new Date().getTime()} [${
        done ? "DONE" : "STEP"
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
