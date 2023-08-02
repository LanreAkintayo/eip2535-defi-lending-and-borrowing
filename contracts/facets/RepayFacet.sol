// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "../libraries/LibDiamond.sol";

import "hardhat/console.sol";
import {AppStorage, Token, LibAppStorage, BorrowedToken} from "../libraries/LibAppStorage.sol";
import {LibDiamond} from "../libraries/LibDiamond.sol";

contract RepayFacet is ReentrancyGuard {
    AppStorage internal s;
    error UnsupportedToken();
    error NoAmountAvailableToBorrow();
    error CannotBorrowAmount();
    error ShouldBeGreaterThanZero();
    error InsufficientFunds();
    error TokenNotBorrowed();

    function repay(address tokenAddress, uint256 tokenAmount) external {
        // Token amount has to be greater than zero
        if (tokenAmount <= 0) {
            revert ShouldBeGreaterThanZero();
        }

        // token has to be supported
        int index = LibAppStorage._indexOf(tokenAddress, s.supportedTokens);

        if (index == -1) {
            revert UnsupportedToken();
        }

        // Check if the user has already borrowed the token below.
        BorrowedToken[] memory userTokensBorrowed = s.tokensBorrowed[
            msg.sender
        ];

        // User has once supplied
        int tokenIndex = indexOf(tokenAddress, userTokensBorrowed);

        if (tokenIndex == -1) {
            revert TokenNotBorrowed();
        } else {
            // Update the value of the token in the contract.

            BorrowedToken memory borrowedToken = s.tokensBorrowed[msg.sender][
                uint256(tokenIndex)
            ];

            uint256 noOfDays = (block.timestamp -
                borrowedToken.startAccumulatingDay) / 86400;

            uint256 totalInterest = (borrowedToken.stableRate *
                borrowedToken.amountBorrowed) / 10000;

            uint256 accumulatedInterest = (noOfDays * totalInterest) / 365;

            uint256 totalToRepay = tokenAmount + accumulatedInterest;

            if (IERC20(tokenAddress).balanceOf(address(this)) < totalToRepay) {
                revert InsufficientFunds();
            }

            s
            .tokensBorrowed[msg.sender][uint(tokenIndex)]
                .amountBorrowed -= tokenAmount;

            s
            .tokensBorrowed[msg.sender][uint(tokenIndex)]
                .startAccumulatingDay = block.timestamp;

            require(
                IERC20(tokenAddress).transferFrom(
                    msg.sender,
                    address(this),
                    totalToRepay
                ),
                "Insufficient funds"
            );
        }
    }

    function getTokenMaxAvailableToRepay(
        address user,
        address tokenAddress
    ) public view returns (uint256 totalToRepay) {
        // Check if the user has already borrowed the token below.
        BorrowedToken[] memory userTokensBorrowed = s.tokensBorrowed[user];

        // User has once supplied
        int tokenIndex = indexOf(tokenAddress, userTokensBorrowed);

        if (tokenIndex == -1) {
            totalToRepay = 0;
        } else {
            BorrowedToken memory borrowedToken = s.tokensBorrowed[user][
                uint256(tokenIndex)
            ];

            uint256 noOfDays = (block.timestamp -
                borrowedToken.startAccumulatingDay) / 86400;

            uint256 totalInterest = (borrowedToken.stableRate *
                borrowedToken.amountBorrowed) / 10000;

            uint256 accumulatedInterest = (noOfDays * totalInterest) / 365;

            totalToRepay = borrowedToken.amountBorrowed + accumulatedInterest;
        }
    }

    function indexOf(
        address tokenAddress,
        BorrowedToken[] memory tokenArray
    ) public pure returns (int256) {
        for (uint i = 0; i < tokenArray.length; i++) {
            BorrowedToken memory currentBorrowedToken = tokenArray[i];
            if (currentBorrowedToken.tokenAddress == tokenAddress) {
                return int256(i);
            }
        }

        return -1;
    }
}
