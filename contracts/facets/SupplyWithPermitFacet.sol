// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "../interfaces/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "../libraries/LibDiamond.sol";

import "hardhat/console.sol";
import {AppStorage, SuppliedToken, LibAppStorage, Token, Modifiers} from "../libraries/LibAppStorage.sol";

contract SupplyWithPermitFacet is ReentrancyGuard, Modifiers {
    // DiamondStorage internal d;

    error InsufficientFunds();
    error InvalidAmount();
    error TokenNotSupported();
    error TokenNotFound();
    error AlreadyOn();
    error AlreadyOff();
    error NotSupplier();
    error CannotSwitchOffCollateral();
    error OnlyOwnerCanCall();
    error AddressZero();
    error AmountCannotBeZero();

    function supplyWithPermit(
        address tokenAddress,
        uint256 tokenAmount,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 sSig
    ) external {
        IERC20 tokenContract = IERC20(tokenAddress);
        uint8 decimals = tokenContract.decimals();

        // You can only supply a token that is supported
        int index = LibAppStorage._indexOf(tokenAddress, s.supportedTokens);

        if (index == -1) {
            revert TokenNotSupported();
        }

        // You should have more than enough to supply
        if (tokenContract.balanceOf(msg.sender) < tokenAmount) {
            revert InsufficientFunds();
        }

        // You cannot supply 0 token
        if (tokenAmount <= 0) {
            revert InvalidAmount();
        }

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

        SuppliedToken[] memory userTokenSupplied = s.tokensSupplied[msg.sender];
        Token memory tokenDetails = s.addressToToken[tokenAddress];

        if (userTokenSupplied.length == 0) {
            // User has never called this function before.
            SuppliedToken memory suppliedToken = SuppliedToken({
                tokenAddress: tokenAddress,
                supplierAddress: msg.sender,
                amountSupplied: tokenAmount,
                supplyInterest: 0,
                supplyStableRate: tokenDetails.supplyStableRate,
                startAccumulatingDay: 0,
                isCollateral: true
            });

            s.tokensSupplied[msg.sender].push(suppliedToken);
            s.allSuppliers.push(msg.sender);
        } else {
            // User has once supplied
            int tokenIndex = indexOf(tokenAddress, userTokenSupplied);

            if (tokenIndex == -1) {
                // Token has never been supplied before
                SuppliedToken memory suppliedToken = SuppliedToken({
                    tokenAddress: tokenAddress,
                    supplierAddress: msg.sender,
                    amountSupplied: tokenAmount,
                    supplyInterest: 0,
                    supplyStableRate: tokenDetails.supplyStableRate,
                    startAccumulatingDay: 0,
                    isCollateral: true
                });
                s.tokensSupplied[msg.sender].push(suppliedToken);
            } else {
                // Update the value of the token in the contract.
                SuppliedToken storage suppliedToken = s.tokensSupplied[
                    msg.sender
                ][uint(tokenIndex)];
                suppliedToken.amountSupplied += tokenAmount;
            }
        }

        // Contract takes token from your wallet
        require(
            tokenContract.transferFrom(msg.sender, address(this), tokenAmount),
            "Transfer from failed"
        );

        /////  After supplying, you will get some LAR token minted to you.
        uint256 tokenAmountInUsd = LibAppStorage._getUsdEquivalent(
            s,
            tokenAmount,
            tokenAddress
        );

        // Assuming that 1 LAR = 1 USD. Send LAR token equivalent to the tokenAmountInUsd.
        // This will be burnt whenever they withdraw from the token.

        // Convert USD
        uint256 larTokenToTransfer = (tokenAmountInUsd * 10 ** 18) /
            10 ** decimals;

        require(
            IERC20(s.larTokenAddress).transfer(msg.sender, larTokenToTransfer),
            "Transfer failed"
        );

        // Update the total supplied
        s.totalSupplied[tokenAddress] += tokenAmount;
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

    function getTokenAvailableLoanAmount(
        address user,
        address tokenAddress
    ) public view returns (uint256) {
        SuppliedToken[] memory suppliedTokens = s.tokensSupplied[user];

        int256 tokenIndex = indexOf(tokenAddress, suppliedTokens);

        SuppliedToken memory suppliedToken = suppliedTokens[
            uint256(tokenIndex)
        ];
        Token memory tokenDetails = s.addressToToken[
            suppliedToken.tokenAddress
        ];

        uint256 availableAmount = (tokenDetails.loanToValue *
            suppliedToken.amountSupplied) / 10000;

        return availableAmount;
    }
}
