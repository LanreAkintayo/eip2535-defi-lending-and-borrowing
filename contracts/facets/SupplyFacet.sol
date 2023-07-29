// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "../libraries/LibDiamond.sol";


import "hardhat/console.sol";
import {AppStorage, SuppliedToken, LibAppStorage, Token} from "../libraries/LibAppStorage.sol";

contract SupplyFacet is ReentrancyGuard {
    AppStorage internal s;
    // DiamondStorage internal d;

    error InsufficientFunds();
    error InvalidAmount();
    error TokenNotSupported();
    error TokenNotFound();
    error AlreadyOn();
    error AlreadyOff();
    error NotSupplier();
    error CannotSwitchOffCollateral();

    function supplyToken(address tokenAddress, uint256 tokenAmount) external {
       
        IERC20 tokenContract = IERC20(tokenAddress);

        // You can only supply a token that is supported
        int index = LibAppStorage._indexOf(tokenAddress, s.supportedTokens);

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
        Token memory tokenDetails = s.addressToToken[tokenAddress];

        if (userTokenSupplied.length == 0) {
            // User has never called this function before.
            SuppliedToken memory suppliedToken;
            suppliedToken.tokenAddress = tokenAddress;
            suppliedToken.supplierAddress = msg.sender;
            suppliedToken.amountSupplied = tokenAmount;
            suppliedToken.supplyInterest = 0;
            suppliedToken.supplyStableRate = tokenDetails.supplyStableRate;
            suppliedToken.startAccumulatingDay = 0;
            suppliedToken.isCollateral = true;


            s.tokensSupplied[msg.sender].push(suppliedToken);
            s.allSuppliers.push(msg.sender);
        } else {
            // User has once supplied
            int tokenIndex = indexOf(tokenAddress, userTokenSupplied);

            if (tokenIndex == -1) {
                // Token has never been supplied before
                SuppliedToken memory suppliedToken;
                suppliedToken.tokenAddress = tokenAddress;
                suppliedToken.supplierAddress = msg.sender;
                suppliedToken.amountSupplied = tokenAmount;
                suppliedToken.supplyInterest = 0;
                suppliedToken.supplyStableRate = tokenDetails.supplyStableRate;
                suppliedToken.startAccumulatingDay = 0;
                suppliedToken.isCollateral = true;

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
        require(tokenContract.transferFrom(msg.sender, address(this), tokenAmount), "Transfer from failed");


        /////  After supplying, you will get some LAR token minted to you.
        uint256 tokenAmountInUsd = LibAppStorage._getUsdEquivalent(tokenAmount, tokenAddress);

        // Assuming that 1 LAR = 1 USD. Send LAR token equivalent to the tokenAmountInUsd. 
        // This will be burnt whenever they withdraw from the token.
        IERC20 larToken = IERC20(s.larTokenAddress);

        require(larToken.transfer(msg.sender, tokenAmountInUsd), "Transfer failed");

    }

    function switchOnCollateral(address tokenAddress) external {

        // msg.sender must have supplied this token already
        SuppliedToken[] memory suppliedTokens = s.tokensSupplied[msg.sender];
        
        if (suppliedTokens.length == 0){
            revert TokenNotFound();
        }

        int256 tokenIndex = indexOf(tokenAddress, suppliedTokens);

        if (tokenIndex == -1){
            revert TokenNotFound();
        }

        // If it has been switched on before, there is no need to switch it on again
        
        SuppliedToken storage suppliedToken = s.tokensSupplied[msg.sender][uint(tokenIndex)];

        if(suppliedToken.supplierAddress != msg.sender){
            revert NotSupplier();
        }
        if (suppliedToken.isCollateral == true){
            revert AlreadyOn();
        }

        suppliedToken.isCollateral = true;
        suppliedToken.supplyInterest = 0;
        suppliedToken.startAccumulatingDay = 0;


    }

    function swithOffCollateral(address tokenAddress) external {
          // msg.sender must have supplied this token already
        SuppliedToken[] memory suppliedTokens = s.tokensSupplied[msg.sender];
            Token memory tokenDetails = s.addressToToken[tokenAddress];

        
        if (suppliedTokens.length == 0){
            revert TokenNotFound();
        }

        int256 tokenIndex = indexOf(tokenAddress, suppliedTokens);

        if (tokenIndex == -1){
            revert TokenNotFound();
        }

        // If it has been switched on before, there is no need to switch it on again
        
        SuppliedToken storage suppliedToken = s.tokensSupplied[msg.sender][uint(tokenIndex)];

        if(suppliedToken.supplierAddress != msg.sender){
            revert NotSupplier();
        }
        if (suppliedToken.isCollateral == false){
            revert AlreadyOff();
        }

        // Make sure that switching it off will not affect the borrowed tokens. I still have to convert those 3 values to USD
        uint256 totalAvailableLoanAmountInUsd = (LibAppStorage._maxLTV(msg.sender) * LibAppStorage._getUserTotalCollateralInUsd(msg.sender)) / 10000;
        uint256 tokenAvailableLoanAmount = getTokenAvailableLoanAmount(msg.sender, tokenAddress);
        uint256 tokenAvailableLoanAmountInUsd = LibAppStorage._getUsdEquivalent(tokenAvailableLoanAmount, tokenAddress);
        // uint256 userTotalBorrowed = getTotalBorrowed(msg.sender);
        uint256 borrowedAmountInUsd = LibAppStorage._getUserTotalBorrowedInUsd(msg.sender);

        if ((totalAvailableLoanAmountInUsd - tokenAvailableLoanAmountInUsd) <= borrowedAmountInUsd){
            revert CannotSwitchOffCollateral();
        }


        suppliedToken.isCollateral = false;
                suppliedToken.supplyInterest =  (tokenDetails.supplyStableRate * suppliedToken.amountSupplied) / 10000;
                suppliedToken.startAccumulatingDay = block.timestamp;
            



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

    
    function getTokenAvailableLoanAmount(address user, address tokenAddress) public view returns(uint256) {
        SuppliedToken[] memory suppliedTokens = s.tokensSupplied[user];

        int256 tokenIndex = indexOf(tokenAddress, suppliedTokens);

        SuppliedToken memory suppliedToken = suppliedTokens[uint256(tokenIndex)];
        Token memory tokenDetails = s.addressToToken[suppliedToken.tokenAddress];

        uint256 availableAmount = (tokenDetails.loanToValue * suppliedToken.amountSupplied) / 100;

        return availableAmount;
        
    }


    


}
