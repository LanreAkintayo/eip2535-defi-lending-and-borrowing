// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "../interfaces/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "../libraries/LibDiamond.sol";

import "hardhat/console.sol";
import {AppStorage, Token, LibAppStorage, BorrowedToken, Modifiers} from "../libraries/LibAppStorage.sol";
import {LibDiamond} from "../libraries/LibDiamond.sol";

contract BorrowFacet is ReentrancyGuard, Modifiers {
    error UnsupportedToken();
    error NoAmountAvailableToBorrow();
    error CannotBorrowAmount();
    error ShouldBeGreaterThanZero();
    error InsufficientFunds();

    function borrow(address tokenAddress, uint256 tokenAmount) external {
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
        int256 maxAvailableToBorrowInUsd = LibAppStorage
            ._getMaxAvailableToBorrowInUsd(s, msg.sender);

        // console.log("Maximum available to borrow: ");
        // console.logInt(maxAvailableToBorrowInUsd);

        if (maxAvailableToBorrowInUsd <= 0) {
            revert NoAmountAvailableToBorrow();
        }

        uint256 tokenAmountInUsd = LibAppStorage._getUsdEquivalent(
            s,
            tokenAmount,
            tokenAddress
        );

        uint8 decimals = IERC20(tokenAddress).decimals();

        uint256 scaledTokenAmountInUsd = (tokenAmountInUsd * 10 ** 18) /
            10 ** decimals;

        // console.log("Token amount in Usd: ", uint(tokenAmountInUsd));
        // console.log("Available to borrow in Usd: ", availableToBorrowInUsd);

        // console.logInt(int256(maxAvailableToBorrowInUsd - tokenAmountInUsd));

        if (maxAvailableToBorrowInUsd - int256(scaledTokenAmountInUsd) < 0) {
            revert CannotBorrowAmount();
        }

        // Make sure we have more than enough of the token in the smart contract.
        if (IERC20(tokenAddress).balanceOf(address(this)) < tokenAmount) {
            revert InsufficientFunds();
        }

        // Check if the user has already borrowed the token below.
        BorrowedToken[] memory userTokensBorrowed = s.tokensBorrowed[
            msg.sender
        ];
        if (userTokensBorrowed.length == 0) {
            // User has never called this function before.
            Token memory tokenDetails = s.addressToToken[tokenAddress];
            BorrowedToken memory borrowedToken;
            borrowedToken.tokenAddress = tokenAddress;
            borrowedToken.amountBorrowed = tokenAmount;
            borrowedToken.startAccumulatingDay = block.timestamp;
            borrowedToken.stableRate = tokenDetails.borrowStableRate;
            borrowedToken.borrowedInterest =
                (tokenDetails.borrowStableRate * tokenAmount) /
                10000;
            borrowedToken.borrowerAddress = msg.sender;

            s.tokensBorrowed[msg.sender].push(borrowedToken);
            s.allBorrowers.push(msg.sender);
        } else {
            // User has once supplied
            int tokenIndex = indexOf(tokenAddress, userTokensBorrowed);

            if (tokenIndex == -1) {
                // Token has never been borrowed before
                Token memory tokenDetails = s.addressToToken[tokenAddress];
                BorrowedToken memory borrowedToken;
                borrowedToken.tokenAddress = tokenAddress;
                borrowedToken.amountBorrowed = tokenAmount;
                borrowedToken.startAccumulatingDay = block.timestamp;
                borrowedToken.stableRate = tokenDetails.borrowStableRate;
                borrowedToken.borrowedInterest =
                    (tokenDetails.borrowStableRate * tokenAmount) /
                    10000;
                borrowedToken.borrowerAddress = msg.sender;

                s.tokensBorrowed[msg.sender].push(borrowedToken);
            } else {
                // Update the value of the token in the contract.
                BorrowedToken storage borrowedToken = s.tokensBorrowed[
                    msg.sender
                ][uint(tokenIndex)];

                borrowedToken.amountBorrowed += tokenAmount;
            }
        }

        // It's time to actually borrow.
        require(
            IERC20(tokenAddress).transfer(msg.sender, tokenAmount),
            "Transfer failed"
        );

        s.totalBorrowed[tokenAddress] += tokenAmount;
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
