// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract TEST1 is ERC20 {
     constructor() ERC20("TEST1 Token", "TEST1") {
        _mint(msg.sender, 100_000_000 * 10**18);
    }


}