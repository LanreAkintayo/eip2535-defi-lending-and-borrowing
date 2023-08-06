// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "../libraries/LibDiamond.sol";
import "../interfaces/IERC20.sol";

import "hardhat/console.sol";
import {AppStorage, Token, LibAppStorage, SuppliedToken, Modifiers} from "../libraries/LibAppStorage.sol";
import {LibDiamond} from "../libraries/LibDiamond.sol";

contract WithdrawFacet is ReentrancyGuard, Modifiers {
    error UnsupportedToken();
    error NoAmountAvailableToWithdraw();
    error CannotWithdrawAmount();
    error ShouldBeGreaterThanZero();
    error InsufficientFunds();
    error TokenNotSupplied();

    error OnlyOwnerCanCall();

    function withdraw(
        address tokenAddress,
        uint256 tokenAmount
    ) external nonReentrant {
        // Token amount has to be greater than zero
        if (tokenAmount <= 0) {
            revert ShouldBeGreaterThanZero();
        }

        // token has to be supported
        int index = LibAppStorage._indexOf(tokenAddress, s.supportedTokens);

        if (index == -1) {
            revert UnsupportedToken();
        }

        // You must have enough collateral.
        int256 maxAvailableToWithdrawInUsd = getMaxAvailableToWithdrawInUsd(
            msg.sender
        );

        // console.log("Maximum available to withdraw: ", uint256(maxAvailableToWithdrawInUsd));

        if (maxAvailableToWithdrawInUsd <= 0) {
            revert NoAmountAvailableToWithdraw();
        }

        uint256 tokenAmountInUsd = LibAppStorage._getUsdEquivalent(
            s,
            tokenAmount,
            tokenAddress
        );
        uint8 decimals = IERC20(tokenAddress).decimals();
        uint256 scaledTokenAmountInUsd = (tokenAmountInUsd * 10 ** 18) /
            10 ** decimals;

        if (
            (maxAvailableToWithdrawInUsd - int256(scaledTokenAmountInUsd)) < 0
        ) {
            revert CannotWithdrawAmount();
        }

        // Make sure we have more than enough of the token in the smart contract.
        if (IERC20(tokenAddress).balanceOf(address(this)) < tokenAmount) {
            revert InsufficientFunds();
        }

        // Check if the user has already borrowed the token below.
        SuppliedToken[] memory userTokensSupplied = s.tokensSupplied[
            msg.sender
        ];

        // User has once supplied
        int tokenIndex = indexOf(tokenAddress, userTokensSupplied);

        if (tokenIndex == -1) {
            revert TokenNotSupplied();
        } else {
            // Update the value of the token in the contract.

            SuppliedToken memory suppliedToken = s.tokensSupplied[msg.sender][
                uint256(tokenIndex)
            ];
            uint totalWithdrawalAmount = tokenAmount;
            uint256 larTokenToBurn = LibAppStorage._getUsdEquivalent(
                s,
                scaledTokenAmountInUsd,
                tokenAddress
            );

            // If it is not used as collateral, send interest to the user. Otherwise, do not send
            if (!suppliedToken.isCollateral) {
                uint256 noOfDays = (block.timestamp -
                    suppliedToken.startAccumulatingDay) / 86400;
                uint256 totalInterest = (suppliedToken.supplyStableRate *
                    suppliedToken.amountSupplied) / 10000;
                uint256 accumulatedInterest = (noOfDays * totalInterest) / 365;

                totalWithdrawalAmount += accumulatedInterest;
            }

            s
            .tokensSupplied[msg.sender][uint(tokenIndex)]
                .amountSupplied -= tokenAmount;

            s.totalSupplied[tokenAddress] -= tokenAmount;

            s
            .tokensSupplied[msg.sender][uint(tokenIndex)]
                .startAccumulatingDay = block.timestamp;

            require(
                IERC20(tokenAddress).transfer(
                    msg.sender,
                    totalWithdrawalAmount
                ),
                "Insufficient funds"
            );
            require(
                IERC20(s.larTokenAddress).burn(msg.sender, larTokenToBurn),
                "Failed to burn"
            );

            if (tokenAmount >= suppliedToken.amountSupplied) {
                // Remove the token from the list of the tokens you borrowed
                SuppliedToken[] storage sSuppliedToken = s.tokensSupplied[
                    msg.sender
                ];
                sSuppliedToken[uint256(tokenIndex)] = sSuppliedToken[
                    sSuppliedToken.length - 1
                ];
                sSuppliedToken.pop();
            }
        }
    }

    function getMaxAvailableToWithdrawInUsd(
        address user
    ) public view returns (int256) {
        uint256 maxLTV = LibAppStorage._maxLTV(s, user);
        uint256 totalCollateralInUsd = LibAppStorage
            ._getUserTotalCollateralInUsd(s, user);
        uint256 totalBorrowedInUsd = LibAppStorage._getUserTotalBorrowedInUsd(
            s,
            user
        );

        return
            int256(
                totalCollateralInUsd - (totalBorrowedInUsd * 10000) / maxLTV
            );
    }

    function indexOf(
        address tokenAddress,
        SuppliedToken[] memory tokenArray
    ) public pure returns (int256) {
        for (uint i = 0; i < tokenArray.length; i++) {
            SuppliedToken memory currentSuppliedToken = tokenArray[i];
            if (currentSuppliedToken.tokenAddress == tokenAddress) {
                return int256(i);
            }
        }

        return -1;
    }
}
