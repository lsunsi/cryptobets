const { utils } = require("ethers");
const { deployContract, MockProvider, solidity } = require("ethereum-waffle");
const Cryptobets = require("../build/contracts/Cryptobets.json");

test("does it fucking work? wtf", async () => {
  const [
    ownerWallet,
    wallet1,
    wallet2,
    wallet3,
  ] = new MockProvider().getWallets();

  const contract = await deployContract(ownerWallet, Cryptobets);

  const contractWallet1 = contract.connect(wallet1);
  const contractWallet2 = contract.connect(wallet2);
  const contractWallet3 = contract.connect(wallet3);

  // Pool creation by the owner
  const poolId = await contract.createPool(1, 2).then((r) => r.value);
  await contract.pools(poolId).then((pool) => {
    expect(pool.startTimestamp.toString()).toBe("1");
    expect(pool.endTimestamp.toString()).toBe("2");
    expect(pool.state).toBe(1);
  });

  // The bets are placed in the pool by the users
  await contractWallet1.placeBet(poolId, 1, {
    value: utils.parseEther("2"),
    gasLimit: 100000,
  });
  await contractWallet2.placeBet(poolId, 1, {
    value: utils.parseEther("3"),
    gasLimit: 100000,
  });
  await contractWallet3.placeBet(poolId, 2, {
    value: utils.parseEther("4"),
    gasLimit: 100000,
  });

  // The pool is started and closed by the owner favoring the bears
  await contract.startPool(poolId, 300);
  await contract.pools(poolId).then((pool) => {
    expect(pool.startPrice.toString()).toBe("300");
    expect(pool.winner).toBe(0);
    expect(pool.state).toBe(2);
  });

  await contract.closePool(poolId, 200);
  await contract.pools(poolId).then((pool) => {
    expect(pool.endPrice.toString()).toBe("200");
    expect(pool.winner).toBe(1);
    expect(pool.state).toBe(3);
  });

  // Winners withdrawal their prizes
  const wallet1BalanceBefore = await wallet1.getBalance();
  const wallet2BalanceBefore = await wallet2.getBalance();

  await contractWallet1.withdraw(poolId);
  await contractWallet2.withdraw(poolId);

  const wallet1BalanceAfter = await wallet1.getBalance();
  const wallet2BalanceAfter = await wallet2.getBalance();

  const wallet1BalanceDelta = wallet1BalanceAfter.sub(wallet1BalanceBefore);
  expect(wallet1BalanceDelta).toEqual(utils.parseEther("3.564"));

  const wallet2BalanceDelta = wallet2BalanceAfter - wallet2BalanceBefore;
  expect(wallet2BalanceDelta).toBe(utils.parseEther("5.346"));
});
