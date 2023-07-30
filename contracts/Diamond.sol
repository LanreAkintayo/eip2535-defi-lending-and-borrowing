// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

/******************************************************************************\
* Author: Nick Mudge <nick@perfectabstractions.com> (https://twitter.com/mudgen)
* EIP-2535 Diamonds: https://eips.ethereum.org/EIPS/eip-2535
*
* Implementation of a diamond.
/******************************************************************************/

import { LibDiamond } from "./libraries/LibDiamond.sol";

import { IDiamondCut } from "./interfaces/IDiamondCut.sol";

contract Diamond {    

// diamondCutFacet has a function that is used to do upgrades
    constructor(address _contractOwner, address _diamondCutFacet) payable {        
        LibDiamond.setContractOwner(_contractOwner);

        // Add the diamondCut external function from the diamondCutFacet
        IDiamondCut.FacetCut[] memory cut = new IDiamondCut.FacetCut[](1);
        bytes4[] memory functionSelectors = new bytes4[](1);
        functionSelectors[0] = IDiamondCut.diamondCut.selector;
        cut[0] = IDiamondCut.FacetCut({
            facetAddress: _diamondCutFacet, 
            action: IDiamondCut.FacetCutAction.Add, 
            functionSelectors: functionSelectors
        });
        LibDiamond.diamondCut(cut, address(0), "");        
    }

    // Find facet for function that is called and execute the
    // function if a facet is found and return any value.
    fallback() external payable {
        LibDiamond.DiamondStorage storage ds;
        
        bytes32 position = LibDiamond.DIAMOND_STORAGE_POSITION;
        assembly {
            ds.slot := position // This sets the position of the struct in the storage
        }
        address facet = ds.selectorToFacetAndPosition[msg.sig].facetAddress; // msg.sig is a global variable that represents the first four bytes of the function signature of the calling function
        require(facet != address(0), "Diamond: Function does not exist");
            assembly {
                calldatacopy(0, 0, calldatasize())
                let result := delegatecall(gas(), facet, 0, calldatasize(), 0, 0)
                returndatacopy(0, 0, returndatasize())
                switch result
                    case 0 {
                        revert(0, returndatasize())
                    }
                    default {
                        return(0, returndatasize())
                    }
            }
    }

    receive() external payable {}
}
