// // SPDX-License-Identifier: MIT
// pragma solidity ^0.8.17;

// import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
// import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
// import "../libraries/LibDiamond.sol";

// import "hardhat/console.sol";
// import {AppStorage, Token, LibAppStorage, BorrowedToken} from "../libraries/LibAppStorage.sol";
// import {LibDiamond} from "../libraries/LibDiamond.sol";

// contract BorrowFacet is ReentrancyGuard {
//     AppStorage internal s;
//     error UnsupportedToken();
//     error NoAmountAvailableToBorrow();
//     error CannotBorrowAmount();
//     error ShouldBeGreaterThanZero();
//     error InsufficientFunds();

//    function borrow(address tokenAddress, uint256 tokenAmount) external {
//         // Token amount has to be greater than zero
//         if (tokenAmount <= 0){
//             revert ShouldBeGreaterThanZero();
//         }

//         // token has to be supported
//         int index = LibAppStorage._indexOf(tokenAddress, s.supportedTokens);

//         if (index == -1){
//             revert UnsupportedToken();
//         }

//         // You must have enough collateral.
//         int256 maxAvailableToBorrowInUsd = getMaxAvailableToBorrowInUsd(msg.sender);

//         if (maxAvailableToBorrowInUsd <= 0){
//             revert NoAmountAvailableToBorrow();
//         }

//         uint256 availableToBorrowInUsd = uint256(maxAvailableToBorrowInUsd);
//         uint256 tokenAmountInUsd = LibAppStorage._getUsdEquivalent(s, tokenAmount, tokenAddress);

//         if ((availableToBorrowInUsd - tokenAmountInUsd) <= 0){
//             revert CannotBorrowAmount();
//         }
        
//         // Make sure we have more than enough of the token in the smart contract.
//         if (IERC20(tokenAddress).balanceOf(address(this)) < tokenAmount){
//             revert InsufficientFunds();
//         }

//         // Check if the user has already borrowed the token below.
//         BorrowedToken[] memory userTokensBorrowed = s.tokensBorrowed[msg.sender];
//          if (userTokensBorrowed.length == 0) {
//             // User has never called this function before.
//             Token memory tokenDetails = s.addressToToken[tokenAddress];
//             BorrowedToken memory borrowedToken;
//             borrowedToken.tokenAddress = tokenAddress;
//             borrowedToken.amountBorrowed = tokenAmount;
//             borrowedToken.startAccumulatingDay = block.timestamp;
//             borrowedToken.stableRate = tokenDetails.borrowStableRate;
//             borrowedToken.borrowedInterest = (tokenDetails.borrowStableRate * tokenAmount) / 10000;
//             borrowedToken.borrowerAddress = msg.sender;



//             s.tokensBorrowed[msg.sender].push(borrowedToken);
//             s.allBorrowers.push(msg.sender);
//         } else {
//             // User has once supplied
//             int tokenIndex = indexOf(tokenAddress, userTokensBorrowed);

//             if (tokenIndex == -1) {
//                 // Token has never been borrowed before
//                 Token memory tokenDetails = s.addressToToken[tokenAddress];
//                 BorrowedToken memory borrowedToken;
//                 borrowedToken.tokenAddress = tokenAddress;
//                 borrowedToken.amountBorrowed = tokenAmount;
//                 borrowedToken.startAccumulatingDay = block.timestamp;
//                 borrowedToken.stableRate = tokenDetails.borrowStableRate;
//                 borrowedToken.borrowedInterest = (tokenDetails.borrowStableRate * tokenAmount) / 10000;
//                 borrowedToken.borrowerAddress = msg.sender;

//                 s.tokensBorrowed[msg.sender].push(borrowedToken);

//             } else {
//                 // Update the value of the token in the contract.
//                 BorrowedToken storage borrowedToken = s.tokensBorrowed[
//                     msg.sender
//                 ][uint(tokenIndex)];

//                 borrowedToken.amountBorrowed += tokenAmount;
//             }
//         }

//         // It's time to actually borrow.
//         require(IERC20(tokenAddress).transfer(msg.sender, tokenAmount), "   Transfer failed");

//    }

//    function getMaxAvailableToBorrowInUsd(address user) public view returns(int256){
//     uint256 maxLTV = LibAppStorage._maxLTV(user);
//     uint256 totalCollateralInUsd = LibAppStorage._getUserTotalCollateralInUsd(user);
//     uint256 totalBorrowedInUsd = LibAppStorage._getUserTotalBorrowedInUsd(user);

//     return int256((9900 * ((maxLTV * totalCollateralInUsd) / 10000 - totalBorrowedInUsd)) / 10000);
//    }

//     function indexOf(
//         address tokenAddress,
//         BorrowedToken[] memory tokenArray
//     ) public pure returns (int256) {
//         for (uint i = 0; i < tokenArray.length; i++) {
//             BorrowedToken memory currentBorrowedToken = tokenArray[i];
//             if (currentBorrowedToken.tokenAddress == tokenAddress) {
//                 return int256(i);
//             }
//         }

//         return -1;
//     }

//  function getAllBorrows(address user) public view returns (BorrowedToken[] memory) {
//         return s.tokensBorrowed[user];
//     }

//     function getBorrowPower(address user) public view returns (uint256) {
//         return (LibAppStorage._getUserTotalBorrowedInUsd(s, user) * 10000)  / (LibAppStorage._maxLTV(s, user) * LibAppStorage._getUserTotalCollateralInUsd(s, user));
//     }

//  function getUserTotalBorrowed(address user) public view returns (uint256) {
//         return LibAppStorage._getUserTotalBorrowedInUsd(s, user);
//     }
 
// }
