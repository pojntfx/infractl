const table = require("markdown-table");

module.exports = async ({ headers, data, preceedingText }) =>
  `${preceedingText ? `${preceedingText}\n` : ""}${table([headers, ...data])}`;
