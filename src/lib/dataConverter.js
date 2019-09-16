const YAML = require("yaml");
const table = require("markdown-table");
const pluralize = require("pluralize");

module.exports.stringify = data => {
  if (Array.isArray(data) && data[0]) {
    const headers = [
      ...Object.keys(data[0])
        .reduce(
          (a, b) => [
            ...a,
            typeof data[0][b] === "object"
              ? Object.keys(data[0][b]).map(
                  localKey =>
                    `${localKey.toUpperCase()}-${pluralize(b, 1).toUpperCase()}`
                )
              : [b.toUpperCase()]
          ],
          []
        )
        .reduce((a, b) => a.concat(b))
    ];
    return table([
      headers,
      ...data.reduce(
        (a, b) => [
          ...a,
          Object.keys(b)
            .map(key =>
              typeof b[key] === "object"
                ? Object.keys(b[key]).map(localKey => b[key][localKey])
                : [b[key]]
            )
            .reduce((a, b) => a.concat(b))
        ],
        []
      )
    ]);
  } else {
    return YAML.stringify(data);
  }
};

module.exports.parse = YAML.parse;
