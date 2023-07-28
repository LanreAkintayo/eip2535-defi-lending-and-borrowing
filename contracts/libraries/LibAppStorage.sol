//SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;
import { Counters } from "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";


    
struct AppStorage {
   address larTokenAddress;

}

library LibAppStorage {
    // diamondStorage() returns the position of the App storage struct in the diamond contract
    function diamondStorage() internal pure returns (AppStorage storage ds) {
        assembly {
            ds.slot := 0
        }
    }


  
}