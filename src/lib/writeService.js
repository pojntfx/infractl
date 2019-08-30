const shell = require("shelljs");
const fs = require("fs");

module.exports = async ({ name, content }) =>
  new Promise(resolve =>
    fs.writeFile(`${shell.tempdir()}/${name}`, content, () =>
      resolve(`${shell.tempdir()}/${name}`)
    )
  );
