// SPDX-License-Identifier: MIT
pragma solidity ^0.7.0;

contract Cryptobets {
    enum PoolState {
        NotCreated,
        Open,
        InProgress,
        Closed
    }

    enum BetOption {None, Bear, Bull}

    struct Pool {
        PoolState state;
        int256 startPrice;
        uint256 startTimestamp;
        int256 endPrice;
        uint256 endTimestamp;
        uint256 upBalance;
        uint256 downBalance;
        BetOption winner;
    }

    struct Bet {
        BetOption option;
        uint256 value;
    }

    address owner;

    uint256[] public poolIds;
    mapping(uint256 => Pool) public pools;
    mapping(uint256 => mapping(address => Bet)) public bets;
    mapping(uint256 => mapping(address => bool)) public withdraws;

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner {
        require(msg.sender == owner, "Only owner");
        _;
    }

    function poolIdsLength() public view returns (uint256) {
        return poolIds.length;
    }

    function createPool(uint256 _startTimestamp, uint256 _endTimestamp) public onlyOwner returns (uint256) {
        uint256 newPoolId = poolIds.length;
        poolIds.push(newPoolId);

        Pool memory newPool = Pool({
            state: PoolState.Open,
            startPrice: 0,
            endPrice: 0,
            startTimestamp: _startTimestamp,
            endTimestamp: _endTimestamp,
            upBalance: 0,
            downBalance: 0,
            winner: BetOption.None
        });
        pools[newPoolId] = newPool;

        return newPoolId;
    }

    function startPool(uint256 _poolId, int256 _startPrice) public onlyOwner {
        require(pools[_poolId].state == PoolState.Open, "Invalid pool state");

        pools[_poolId].startPrice = _startPrice;
        pools[_poolId].state = PoolState.InProgress;
    }

    function closePool(uint256 _poolId, int256 _endPrice) public onlyOwner {
        require(pools[_poolId].state == PoolState.InProgress, "Invalid pool state");

        pools[_poolId].endPrice = _endPrice;
        pools[_poolId].state = PoolState.Closed;

        if (pools[_poolId].endPrice > pools[_poolId].startPrice) {
            pools[_poolId].winner = BetOption.Bull;
        } else if (pools[_poolId].endPrice < pools[_poolId].startPrice) {
            pools[_poolId].winner = BetOption.Bear;
        }
    }

    function placeBet(uint256 _poolId, BetOption _option) public payable {
        require(msg.value >= 1 ether, "Minimum bet value");
        require(pools[_poolId].state == PoolState.Open, "Invalid pool state");
        require(_option == BetOption.Bull || _option == BetOption.Bear, "Invalid bet option");

        // Should be extended to accept increasing bets
        require(bets[_poolId][msg.sender].option == BetOption.None, "Bet already placed");

        bets[_poolId][msg.sender] = Bet({
            option: _option,
            value: msg.value
        });

        if (_option == BetOption.Up) {
            pools[_poolId].upBalance += msg.value;
        } else if (_option == BetOption.Down) {
            pools[_poolId].downBalance += msg.value;
        }
    }

    function withdraw(uint _poolId) public payable {
        require(pools[_poolId].state == PoolState.Closed, "Pool not closed");

        Bet memory bet = bets[_poolId][msg.sender];
        require(bet.value >= 1 ether, "Did not bet");

        require(bet.option == pools[_poolId].winner, "Nothing to redeem");
        require(!withdraws[_poolId][msg.sender], "Already got the reward");

        withdraws[_poolId][msg.sender] = true;

        Pool memory pool = pools[_poolId];

        uint256 winnerBalance;
        if (pool.winner == BetOption.Up) {
            winnerBalance = pool.upBalance;
        } else if (pool.winner == BetOption.Down) {
            winnerBalance = pool.downBalance;
        } else {
            assert(false);
        }

        uint256 withdrawValue = ((pool.upBalance + pool.downBalance) * bet.value * 99) / (winnerBalance * 100);

        msg.sender.transfer(withdrawValue);
    }
}
