const Cryptobets = artifacts.require("Cryptobets");

// Traditional Truffle test
contract("Cryptobets", ([ownerWallet, wallet1, wallet2, wallet3]) => {
  it("", async function () {
    const contract = await Cryptobets.new();

    // Pool creation by the owner
    const poolId = await contract.createPool.call(1, 2);
    await contract.createPool(1, 2);

    await contract.pools(poolId).then((pool) => {
      expect(pool.startTimestamp.toString()).equal("1");
      expect(pool.endTimestamp.toString()).equal("2");
      expect(pool.state.toString()).equal("1");
    });

    // The bets are placed in the pool by the users
    await contract.placeBet(poolId, 1, {
      value: web3.utils.toWei("2", "ether"),
      from: wallet1,
    });
    await contract.placeBet(poolId, 1, {
      value: web3.utils.toWei("3", "ether"),
      from: wallet2,
    });
    await contract.placeBet(poolId, 2, {
      value: web3.utils.toWei("4", "ether"),
      from: wallet3,
    });

    // // The pool is started and closed by the owner favoring the bears
    await contract.startPool(poolId, 300);
    await contract.pools(poolId).then((pool) => {
      expect(pool.startPrice.toString()).equal("300");
      expect(pool.winner.toString()).equal("0");
      expect(pool.state.toString()).equal("2");
    });

    await contract.closePool(poolId, 200);
    await contract.pools(poolId).then((pool) => {
      expect(pool.endPrice.toString()).equal("200");
      expect(pool.winner.toString()).equal("1");
      expect(pool.state.toString()).equal("3");
    });

    // Winners withdrawal their prizes
    const wallet1BalanceBefore = await web3.eth.getBalance(wallet1);
    const wallet2BalanceBefore = await web3.eth.getBalance(wallet2);

    const withdrawTx1 = await contract.withdraw(poolId, { from: wallet1 });
    const withdrawTx2 = await contract.withdraw(poolId, { from: wallet2 });

    const wallet1BalanceAfter = await web3.eth.getBalance(wallet1);
    const wallet2BalanceAfter = await web3.eth.getBalance(wallet2);

    const gasPrice = await web3.eth.getGasPrice();

    const wallet1BalanceDelta =
      wallet1BalanceAfter +
      withdrawTx1.receipt.gasUsed * gasPrice -
      wallet1BalanceBefore;

    const wallet2BalanceDelta =
      wallet2BalanceAfter +
      withdrawTx2.receipt.gasUsed * gasPrice -
      wallet2BalanceBefore;

    expect(wallet1BalanceDelta).equal(web3.utils.toWei("3.564", "ether"));
    expect(wallet2BalanceDelta).equal(web3.utils.toWei("5.346", "ether"));
  });
});
