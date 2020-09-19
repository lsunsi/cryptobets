const Migrations = artifacts.require("Migrations");
const Cryptobets = artifacts.require("Cryptobets");

module.exports = function (deployer) {
  deployer.deploy(Migrations);
  deployer.deploy(Cryptobets);
};
