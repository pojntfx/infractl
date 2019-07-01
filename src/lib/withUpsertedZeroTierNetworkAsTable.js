const ZeroTier = require("./zerotier");
const withTable = require("./withTable");

module.exports = withUpsertedZeroTierNetworkAsTable = ({
  id,
  networkName,
  private,
  config
}) =>
  new Promise(resolve =>
    new ZeroTier(config)
      .upsertNetwork(
        id || undefined,
        networkName
          ? private === "true"
            ? {
                config: {
                  name: networkName,
                  private: true
                }
              }
            : private === "false"
            ? {
                config: {
                  name: networkName,
                  private: false
                }
              }
            : {
                config: {
                  name: networkName
                }
              }
          : private === "true"
          ? {
              config: {
                private: true
              }
            }
          : private === "false"
          ? {
              config: {
                private: false
              }
            }
          : {}
      )
      .then(
        ({
          id,
          config: { name, private },
          onlineMemberCount,
          authorizedMemberCount
        }) => {
          withTable({
            preceedingText: "Network successfully applied:",
            headers: [
              "ID",
              "NAME",
              "PRIVATE",
              "ONLINE MEMBERS",
              "AUTHORIZED MEMBERS"
            ],
            data: [
              [id, name, private, onlineMemberCount, authorizedMemberCount]
            ]
          }).then(table => resolve(table));
        }
      )
  );
