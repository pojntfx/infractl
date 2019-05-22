module.exports = async (config, functionToCall) => {
  if (config.endpoint && config.accessToken) {
    functionToCall(config);
  } else {
    console.error(
      "The networks part (ZeroTier) of infractl has not yet been set up!"
    );
  }
};
