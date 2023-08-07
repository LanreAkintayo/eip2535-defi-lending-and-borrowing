// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import {AppStorage, SuppliedToken, LibAppStorage, Token} from "../libraries/LibAppStorage.sol";

interface IDiamond {
    function supply(address tokenAddress, uint256 tokenAmount) external;

    function switchOnCollateral(address tokenAddress) external;

    function swithOffCollateral(address tokenAddress) external;

    function borrow(address tokenAddress, uint256 tokenAmount) external;

    function withdraw(address tokenAddress, uint256 tokenAmount) external;

    function repay(address tokenAddress, uint256 tokenAmount) external;

    function addToTotalSupply(
        address tokenAddress,
        uint256 tokenAmount
    ) external;

    function supplyWithPermit(
        address tokenAddress,
        uint256 tokenAmount,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 sSig
    ) external;
}
