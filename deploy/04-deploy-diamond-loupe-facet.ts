import { getSelectors, FacetCutAction } from "../utils/diamond"
import { HardhatRuntimeEnvironment } from "hardhat/types"
import { networkConfig, developmentChains } from "../helper-hardhat-config"
import { DeployFunction } from "hardhat-deploy/types"
import { ethers } from "hardhat"
import { getContract } from "../utils/helper"


const deployDiamondLoupeFacet:DeployFunction = async function(hre: HardhatRuntimeEnvironment) {

   const { getNamedAccounts, deployments, network } = hre
   const { deploy, log } = deployments
   const { deployer } = await getNamedAccounts()


   log("\n")
   const diamondLoupeFacet = await deploy("DiamondLoupeFacet", {
    from: deployer,
    args: [],
    log: true,
    // we need to wait if on a live network so we can verify properly
    waitConfirmations: networkConfig[network.name].blockConfirmations || 0,
  })


  const facetInstance = await ethers.getContract("DiamondLoupeFacet") 
 
  const allFragments= facetInstance.interface.fragments

  // for (let i = 0; i < allFragments.length; i++){

  //   // console.log(allFragments[i], "\n\n\n")
  //  const functionName = await facetInstance.getFunction(allFragments[i])

  //  const signature = functionName._key
  //   const sigHash = facetInstance.interface.getFunction(signature).selector;

  //  console.log(`${signature}::: ${sigHash}`)


  // }
  // console.log(facetInstance.interface.fragments[0])

  // console.log('DiamondLoupeFacet deployed:', diamondLoupeFacet.address, "\n")


  // Now let's add all the selectors of the diamondLoupeFacet to the diamond
  /*
  
  facetAddress(bytes4)::: 0xcdffacc6
  facetAddresses()::: 0x52ef6b2c
  facetFunctionSelectors(address)::: 0xadfca15e
  facets()::: 0x7a0ed627
  supportsInterface(bytes4)::: 0x01ffc9a7
  
  */

  const diamondLoupeFunctionSelectors = getSelectors(facetInstance)
  // const currentSelector = getSelectors(facetInstance)

  // console.log("Current SElector: ", currentSelector)

  const cut = [{
    facetAddress: diamondLoupeFacet.address,
    action: FacetCutAction.Add,
    functionSelectors: diamondLoupeFunctionSelectors
  }]

  // Add the Diamond Loupe Facet and at the same time, invoke the init() function inside the DiamontInit contract.
   const diamond = await ethers.getContract('Diamond')
  const diamondCut = await ethers.getContractAt('IDiamondCut', diamond.target)

   const diamondInit = await ethers.getContract('DiamondInit')
   let tx
  let receipt
  
   // call to init function
   let functionCall = diamondInit.interface.encodeFunctionData('init')
 
   tx = await diamondCut.diamondCut(cut, diamondInit.target, functionCall)
  receipt = await tx.wait()
  
   if (!receipt?.status) {
     throw Error(`Diamond upgrade failed: ${tx.hash}`)
  }
  
   console.log('Completed diamond cut')



}


export default deployDiamondLoupeFacet

deployDiamondLoupeFacet.tags = ["all", "all-diamonds", "diamondLoupeFacet"]

//  // deploy facets
//  console.log('')
//  console.log('Deploying facets')
//  const FacetNames = [
//    'DiamondLoupeFacet',
//    'OwnershipFacet',
//    'ERC20Facet',
//    'ERC20PermitFacet',
//    'MintFacet'
//  ]
//  const cut = []
//  for (const FacetName of FacetNames) {
//    const Facet = await ethers.getContractFactory(FacetName)
//    const facet = await Facet.deploy()
//    await facet.deployed()
//    console.log(`${FacetName} deployed: ${facet.address}`)
//    cut.push({
//      facetAddress: facet.address,
//      action: FacetCutAction.Add,
//      functionSelectors: getSelectors(facet)
//    })
//  }

//  // upgrade diamond with facets
//  console.log('')
//  // console.log('Diamond Cut:', cut)
//  const diamondCut = await ethers.getContractAt('IDiamondCut', diamond.address)
//  let tx
//  let receipt
//  // call to init function
//  let functionCall = diamondLoupeFacet.interface.encodeFunctionData('init')
//  tx = await diamondCut.diamondCut(cut, diamondLoupeFacet.address, functionCall)
//  console.log('Diamond cut tx: ', tx.hash)
//  receipt = await tx.wait()
//  if (!receipt.status) {
//    throw Error(`Diamond upgrade failed: ${tx.hash}`)
//  }
//  console.log('Completed diamond cut')
//  return diamond.address
// }