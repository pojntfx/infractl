const YAML = require("yaml");
const table = require("markdown-table");

module.exports.stringify = data => {
  if (Array.isArray(data)) {
    const headers = Object.keys(data[0]).map(key => key.toUpperCase());
    return table([
      headers,
      ...data.map(prop => Object.keys(prop).map(key => prop[key]))
    ]);
  } else {
    return YAML.stringify(data);
  }
};

module.exports.parse = YAML.parse;
