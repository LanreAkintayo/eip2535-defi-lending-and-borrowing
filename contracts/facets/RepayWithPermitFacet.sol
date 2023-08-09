// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "../interfaces/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "../libraries/LibDiamond.sol";

import "hardhat/console.sol";
import {AppStorage, Token, LibAppStorage, BorrowedToken} from "../libraries/LibAppStorage.sol";
import {LibDiamond} from "../libraries/LibDiamond.sol";

contract RepayWithPermitFacet is ReentrancyGuard {
    AppStorage internal s;
    error UnsupportedToken();
    error NoAmountAvailableToBorrow();
    error CannotBorrowAmount();
    error ShouldBeGreaterThanZero();
    error InsufficientFunds();
    error TokenNotBorrowed();

    function repayWithPermit(
        address tokenAddress,
        uint256 tokenAmount,
         uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 sSig
    ) external {
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

            // Let's approve the contract to spend from msg.sender
            IERC20(tokenAddress).permit(
                msg.sender,
                address(this),
                tokenAmount,
                deadline,
                v,
                r,
                sSig
            );

            BorrowedToken memory borrowedToken = s.tokensBorrowed[msg.sender][
                uint256(tokenIndex)
            ];

            uint256 noOfDays = (block.timestamp -
                borrowedToken.startAccumulatingDay) / 86400;

            uint256 totalInterest = (borrowedToken.stableRate *
                borrowedToken.amountBorrowed) / 10000;

            uint256 totalToRepay = tokenAmount + (noOfDays * totalInterest) / 365;

            if (IERC20(tokenAddress).balanceOf(address(this)) < totalToRepay) {
                revert InsufficientFunds();
            }

            s
            .tokensBorrowed[msg.sender][uint(tokenIndex)]
                .amountBorrowed -= tokenAmount;

            s
            .tokensBorrowed[msg.sender][uint(tokenIndex)]
                .startAccumulatingDay = block.timestamp;

            s.totalBorrowed[tokenAddress] -= tokenAmount;

            if (tokenAmount >= borrowedToken.amountBorrowed) {
                // Remove the token from the list of the tokens you borrowed
                BorrowedToken[] storage sBorrowedToken = s.tokensBorrowed[
                    msg.sender
                ];
                sBorrowedToken[uint256(tokenIndex)] = sBorrowedToken[
                    sBorrowedToken.length - 1
                ];
                sBorrowedToken.pop();
            }

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
