// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "../libraries/LibDiamond.sol";

import "hardhat/console.sol";
import {AppStorage} from "../libraries/LibAppStorage.sol";

contract InitializerFacet is ReentrancyGuard {
    AppStorage internal s;
    // DiamondStorage internal d;

    function initializeFacet(address governanceToken) external {
        s.larTokenAddress = governanceToken;
    }

 
}
