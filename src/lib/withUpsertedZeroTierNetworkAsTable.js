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
          ? private
            ? {
                config: {
                  name: networkName,
                  private: true
                }
              }
            : {
                config: {
                  name: networkName
                }
              }
          : private
          ? {
              config: {
                private: true
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
