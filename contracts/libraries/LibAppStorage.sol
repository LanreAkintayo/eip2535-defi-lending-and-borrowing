//SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;
import { Counters } from "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";


struct Token {
    address tokenAddress;
    uint8 liquidationThreshold;
    uint8 loanToValue;
    uint8 borrowStableRate;
    uint8 lendStableRate;
    uint8 liquidationPenalty;
}

struct SuppliedToken {
    address tokenAddress;
    address supplierAddress;
    uint256 amountSupplied;
    uint256 currentInterest;
    bool isCollateral;
    uint256 startEarningDay;
}

struct BorrowedToken {
    address tokenAddress;
    uint256 amountBorrowed;
    uint256 currentInterest;
}


    
struct AppStorage {
   address larTokenAddress;
   address[] supportedTokens;
   mapping(address => Token) addressToToken;
   mapping(address => address) tokenToPriceFeed;

   mapping(address => SuppliedToken[]) tokensSupplied;
   

   address[] allSuppliers;
   address[] allBorrowers;



}

library LibAppStorage {
    // diamondStorage() returns the position of the App storage struct in the diamond contract
    function diamondStorage() internal pure returns (AppStorage storage ds) {
        assembly {
            ds.slot := 0
        }
    }

    function indexOf(address targetAddress, address[] memory addressArray) internal pure returns(int256){
        for (uint256 i = 0; i < addressArray.length; i++){
            if (targetAddress == addressArray[i]){
                return int256(i);
            }
        }
        return -1;
    }

     function getUsdEquivalent(uint256 amount, address tokenAddress)
        internal
        view
        returns (uint256)
    {
        (
            uint256 dollarPerToken,
            uint256 decimals
        ) = oneTokenEqualsHowManyDollars(tokenAddress);

        uint256 totalAmountInDollars = (amount * dollarPerToken) /
            (10**decimals);
        return totalAmountInDollars;
    }

    function oneTokenEqualsHowManyDollars(address tokenAddress)
        internal
        view
        returns (uint256, uint256)
    {
        AppStorage storage s = diamondStorage();
        address tokenPriceFeed = s.tokenToPriceFeed[tokenAddress];
        AggregatorV3Interface priceFeed = AggregatorV3Interface(tokenPriceFeed);

        (, int256 price, , , ) = priceFeed.latestRoundData();

        uint256 decimals = priceFeed.decimals();

        return (uint256(price), decimals);
    }



  
}