module.exports = class {
  async log(destination, message) {
    console.log(
      `${new Date().getTime()} [INFO] ${`${message} `.padEnd(
        55,
        "."
      )} ${`${destination}`}`
    );
  }

  async divide() {
    console.log("");
  }
};
