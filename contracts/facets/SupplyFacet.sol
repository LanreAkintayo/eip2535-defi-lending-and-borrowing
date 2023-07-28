// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "../libraries/LibDiamond.sol";


import "hardhat/console.sol";
import {AppStorage, SuppliedToken, LibAppStorage} from "../libraries/LibAppStorage.sol";

contract SupplyFacet is ReentrancyGuard {
    AppStorage internal s;
    // DiamondStorage internal d;

    error InsufficientFunds();
    error InvalidAmount();
    error TokenNotSupported();

    function supplyToken(address tokenAddress, uint256 tokenAmount) external {
       
        IERC20 tokenContract = IERC20(tokenAddress);

        // You can only supply a token that is supported
        int index = LibAppStorage.indexOf(tokenAddress, s.supportedTokens);

        if (index == -1){
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

        SuppliedToken[] memory userTokenSupplied = s.tokensSupplied[msg.sender];
        if (userTokenSupplied.length == 0) {
            // User has never called this function before.
            SuppliedToken memory suppliedToken;
            suppliedToken.tokenAddress = tokenAddress;
            suppliedToken.amountSupplied = tokenAmount;
            suppliedToken.currentInterest = 0;
            suppliedToken.isCollateral = true;
            suppliedToken.startEarningDay = 0;

            s.tokensSupplied[msg.sender].push(suppliedToken);
            s.allSuppliers.push(msg.sender);
        } else {
            // User has once supplied
            int tokenIndex = indexOf(tokenAddress, userTokenSupplied);

            if (tokenIndex == -1) {
                // Token has never been supplied before
                SuppliedToken memory suppliedToken;
                suppliedToken.tokenAddress = tokenAddress;
                suppliedToken.amountSupplied = tokenAmount;
                suppliedToken.currentInterest = 0;
                suppliedToken.isCollateral = true;
                suppliedToken.startEarningDay = 0;

                s.tokensSupplied[msg.sender].push(suppliedToken);
            } else {
                // Update the value of the token in the contract.
                SuppliedToken storage suppliedToken = s.tokensSupplied[
                    msg.sender
                ][uint(tokenIndex)];
                suppliedToken.amountSupplied += tokenAmount;
            }
        }

        /////  After supplying, you will get some LAR token minted to you.
        uint256 tokenAmountInUsd = LibAppStorage.getUsdEquivalent(tokenAmount, tokenAddress);

        // Assuming that 1 LAR = 1 USD. Send LAR token equivalent to the tokenAmountInUsd. 
        // This will be burnt whenever they withdraw from the token.
        IERC20 larToken = IERC20(s.larTokenAddress);

        require(larToken.transfer(msg.sender, tokenAmountInUsd), "Transfer failed");



    }

    function switchOnCollateral(address tokenAddress) external {
        // If it has been switched on before, there is no need to switch it on again

        // msg.sender must have supplied this token already

        

    }

    function swithOffCollateral(address tokenAddress) external {


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
