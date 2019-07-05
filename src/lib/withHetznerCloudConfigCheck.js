module.exports = async (config, functionToCall) => {
  if (config.endpoint && config.accessToken) {
    functionToCall(config);
  } else {
    console.error(
      "The nodes part (Hetzner Cloud) of infractl has not yet been set up!"
    );
  }
};
