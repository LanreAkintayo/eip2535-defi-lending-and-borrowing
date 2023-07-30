// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "../libraries/LibDiamond.sol";

import "hardhat/console.sol";
import {AppStorage, Token, LibAppStorage, TokenPriceFeed} from "../libraries/LibAppStorage.sol";
import {LibDiamond} from "../libraries/LibDiamond.sol";

contract InitializerFacet is ReentrancyGuard {
    AppStorage internal s;

    error OnlyOwnerCanCall();

    modifier onlyOwner(){
          if (msg.sender != LibDiamond.diamondStorage().contractOwner){
            revert OnlyOwnerCanCall();
        }
        _;
    }

    function initializeFacet(address governanceToken) external onlyOwner {
        
        s.larTokenAddress = governanceToken;
    }

    function setAllSupportedTokens(Token[] memory tokens) external onlyOwner(){
        
        for (uint i = 0; i < tokens.length; i++){
            Token memory currentToken = tokens[i];

            int index = LibAppStorage._indexOf(currentToken.tokenAddress, s.supportedTokens);
            if (index == -1){
                 s.supportedTokens.push(currentToken.tokenAddress);
                s.addressToToken[currentToken.tokenAddress] = currentToken;
            }

           
        }
    }


    function setTokenPriceFeed(TokenPriceFeed[] memory tokenPriceFeeds) external onlyOwner {
        for (uint i = 0; i < tokenPriceFeeds.length; i++){
            TokenPriceFeed memory currentTokenPriceFeed = tokenPriceFeeds[i];
            console.log("token address: inside setter ", currentTokenPriceFeed.tokenAddress);
            console.log("Token pricefeed: ", currentTokenPriceFeed.priceFeed);

        s.tokenToPriceFeed[currentTokenPriceFeed.tokenAddress] = currentTokenPriceFeed.priceFeed;

            console.log("Token pricefeed: ", currentTokenPriceFeed.priceFeed);


        }
    }

     function getAllSupportedTokens() external view returns(address[] memory){
        return s.supportedTokens;
    }

   



 
}
