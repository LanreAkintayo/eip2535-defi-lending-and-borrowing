// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

contract MockOracle {
    int mockPrice;
    address owner;
    uint8 decimal;

    constructor(int _mockPrice, uint8 _decimals) {
        mockPrice = _mockPrice;
        decimal = _decimals;
        owner = msg.sender;
    }


    function updateMockPrice(int _mockPrice) external {
        require(msg.sender == owner, "Only owner can update price");
        mockPrice = _mockPrice;
    }

    function decimals() external view returns (uint8){
        return decimal;
    }


    function latestRoundData()
        external
        view
        returns (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        )
    {
        roundId = 1;
        answer = mockPrice;
        startedAt = block.timestamp - 5;
        updatedAt = block.timestamp;
        answeredInRound = 1;
    }
}
