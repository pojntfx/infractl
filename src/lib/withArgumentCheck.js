module.exports = (commander, functionToTest, functionToCallIfSuccessful) =>
  functionToTest(commander)
    ? functionToCallIfSuccessful(commander)
    : commander.outputHelp();
