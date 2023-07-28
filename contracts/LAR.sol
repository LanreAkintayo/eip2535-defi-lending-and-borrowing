// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract LAR is ERC20 {
     constructor() ERC20("LAR Token", "LAR") {
        _mint(msg.sender, 100_000_000 * 10**18);
    }
}