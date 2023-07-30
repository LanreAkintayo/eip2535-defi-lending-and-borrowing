// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import {AppStorage, SuppliedToken, LibAppStorage, Token} from "../libraries/LibAppStorage.sol";

interface IDiamond {
    function supplyToken(address tokenAddress, uint256 tokenAmount) external;

    function switchOnCollateral(address tokenAddress) external;

    function swithOffCollateral(address tokenAddress) external;

    function getTokenAvailableLoanAmount(
        address user,
        address tokenAddress
    ) external view returns (uint256);

    function getHealthFactor(address user) external view returns (uint256);

    function getMaxLTV(address user) external view returns (uint256);

    function getLiquidationThreshold(
        address user
    ) external view returns (uint256);

    function getUserTotalCollateralInUsd(
        address user
    ) external view returns (uint256);

    function getNetworth(address user) external view returns (uint256);

    function getCurrentLTV(address user) external view returns (uint256);

    function getAllSupplies(
        address user
    ) external view returns (SuppliedToken[] memory);

    function getAllSuppliers() external view returns(address[] memory) ;
}
