const { expect, use } = require('chai');
const { BigNumber, constants: { WeiPerEther } } = require('ethers');
const { deployContract, MockProvider, solidity } = require('ethereum-waffle');
const Cryptobets = require('../build/contracts/Cryptobets.json');

use(solidity);

test('does it fucking work? wtf', async () => {
    const [ownerWallet, wallet1, wallet2] = new MockProvider().getWallets();

    const contract = await deployContract(ownerWallet, Cryptobets);

    const poolId = (await contract.createPool(1, 2)).value;

    const contractWallet1 = contract.connect(wallet1);
    const contractWallet2 = contract.connect(wallet2);


    console.log(await contractWallet1.placeBet(poolId, 1, { value: WeiPerEther, gasLimit: WeiPerEther }));


    // expect((await contract.poolIdsLength()).toString()).equal('1');
});

