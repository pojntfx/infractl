module.exports = class {
  async log(destination, message) {
    console.log(
      `${new Date().getTime()} [INFO] ${`${message} `.padEnd(
        60,
        "."
      )} ${`${destination}`}`
    );
  }

  async logData(name, value) {
    console.log(`${name}="${value}"`);
  }

  async divide() {
    console.log("");
  }
};
