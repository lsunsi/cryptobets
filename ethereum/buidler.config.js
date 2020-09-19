usePlugin("@nomiclabs/buidler-truffle5");

module.exports = {
  solc: {
    version: "0.7.0",
    optimizer: {
      enabled: true,
      runs: 200,
    },
  },
};
