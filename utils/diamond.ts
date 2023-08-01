/* global ethers */

import { BaseContract, Contract, FunctionFragment } from "ethers"
import { ethers } from "hardhat"

export const FacetCutAction = { Add: 0, Replace: 1, Remove: 2 }

// get function selectors from ABI
export const getSelectors = (contract: any) =>  {
  const allFragments = contract.interface.fragments
  let signatures:string[] = []

  for (const eachFragment of allFragments){
    if (eachFragment.type == "function"){
      const currentFragmentFunction = contract.getFunction(eachFragment)
      signatures.push(currentFragmentFunction._key)
    }
  }

  // const sig  natures = Object.keys(contract.interface.fragments)
  const selectors: any = signatures.reduce((acc: string[], val: string) => {
    if (val !== 'init(bytes)') {
      const sigHash = contract.interface.getFunction(val).selector
      
        acc.push(sigHash);
    }
    return acc
  }, [])
  selectors.contract = contract
  selectors.remove = remove
  selectors.get = get
  return selectors
}


// used with getSelectors to remove selectors from an array of selectors
// functionNames argument is an array of function signatures
export function remove (functionNames: string[]) {
  //@ts-ignore
  const self = this
  const selectors = self.filter((v:string) => {
    for (const functionName of functionNames) {
      const currentFunction =
        self.contract.interface.getFunction(functionName);
      
      const currentSelector = currentFunction.selector;

      if (v === currentSelector) {
        return false
      }
    }
    return true
  })
  selectors.contract = self.contract
  selectors.remove = self.remove
  selectors.get = self.get
  return selectors
}

// used with getSelectors to get selectors from an array of selectors
// functionNames argument is an array of function signatures
export function get (functionNames: string[]) {
  //@ts-ignore
  const self = this
  const selectors = self.filter((v:string) => {
    for (const functionName of functionNames) {
      if (v === self.contract.interface.getFunction(functionName).selector) {
        return true
      }
    }
    return false
  })
  selectors.contract = self.contract
  selectors.remove = self.remove
  selectors.get = self.get
  return selectors
}


// find a particular address position in the return value of diamondLoupeFacet.facets()
export function findAddressPositionInFacets (facetAddress: string, facets: any[]) {
  for (let i = 0; i < facets.length; i++) {
    if (facets[i].facetAddress === facetAddress) {
      return i
    }
  }
}

// exports.getSelectors = getSelectors
// exports.getSelector = getSelector
// exports.FacetCutAction = FacetCutAction
// exports.remove = remove
// exports.removeSelectors = removeSelectors
// exports.findAddressPositionInFacets = findAddressPositionInFacets
