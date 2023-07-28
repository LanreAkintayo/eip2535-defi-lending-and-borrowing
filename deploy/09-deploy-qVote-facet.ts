import { getSelectors, FacetCutAction } from "../utils/diamond"
import { HardhatRuntimeEnvironment } from "hardhat/types"
import { networkConfig, developmentChains } from "../helper-hardhat-config"
import { DeployFunction } from "hardhat-deploy/types"
import { ethers } from "hardhat"
import { fromWei, toWei } from "../utils/helper"
import { ZeroAddress } from "ethers"

const deployQuadraticVoteFacet:DeployFunction = async function(hre: HardhatRuntimeEnvironment) {

   // @ts-ignore
   const { getNamedAccounts, deployments, network } = hre
   const { deploy, log } = deployments
   const { deployer, treasury } = await getNamedAccounts()


   const diamond = await ethers.getContract('Diamond')
  //  const diamond = await ethers.getContract('Diamond')


   console.log("Diamond.target", diamond.target)


   // Deploy the contract first
   log("\n")
   const quadraticVoteFacetDeployment = await deploy("QuadraticVoteFacet", {
    from: deployer,
    args: [],
    log: true,
    // we need to wait if on a live network so we can verify properly
    waitConfirmations: networkConfig[network.name].blockConfirmations || 0,
  })


  const quadraticVoteFacet = await ethers.getContract("QuadraticVoteFacet") 

  console.log('QuadraticVoteFacet deployed:', quadraticVoteFacet.target, "\n")

  console.log("Quadratic vote facet: ", quadraticVoteFacet)

  // Let's send some LAR token to the contract
  // const lar = await ethers.getContract("LAR")
  // await lar.transfer(diamond.target, toWei(100000)) 
  
  // Let's call the sendLAR() function here
    let dao = await ethers.getContractAt("IDaoFacet", diamond.target)
    
    // const before = fromWei(await lar.balanceOf(treasury))

    // let sendTx = await dao.sendLAR(treasury) 
    // await sendTx.wait()

    // const after = fromWei(await lar.balanceOf(treasury))

    // // Try to get the list of proposals here.
    // let updateTx = await dao.updateProposalList(1)
    // await updateTx.wait(1)

    // // Get the proposalList
    // const listOfProposal1 = await dao.getProposalsList();


    

//   const selectorsToAdd = getSelectors(quadraticVoteFacet).get(['getTotalVotingPower(uint256[])'])
//   const selectorToReplace = getSelectors(quadraticVoteFacet).get(['deletePreviousData()'])
  const selectorsToAdd = getSelectors(quadraticVoteFacet).get(['voteProposalByQuadratic(uint256,uint256[],uint256[])'])

  const cut = [
    {
    facetAddress: quadraticVoteFacet.target,
    action: FacetCutAction.Add,
    functionSelectors: selectorsToAdd
  },
//   {
//     facetAddress: quadraticVoteFacet.target,
//     action: FacetCutAction.Replace,
//     functionSelectors: selectorToReplace
//   },
]

  // // Add the Diamond Loupe Facet and at the same time, invoke the init() function inside the DiamontInit contract.
  const diamondCut = await ethers.getContractAt('IDiamondCut', diamond.target)

   let tx
   let receipt

   tx = await diamondCut.diamondCut(cut, ZeroAddress, "0x")
 
   receipt = await tx.wait()

   if (!receipt.status) {
     throw Error(`Diamond upgrade failed: ${tx.hash}`)
   }
   console.log('Completed diamond cut')


   // Let's Recall the sendLAR() function here.

  //  const before1 = fromWei(await lar.balanceOf(treasury))

  //   sendTx = await dao.sendLAR(treasury) 
  //   await sendTx.wait()

  //   const after1 = fromWei(await lar.balanceOf(treasury))

  //   // Try to call it here
  //     // Try to get the list of proposals here.
  //     let updateTx = await dao.updateProposalList(100)
  //     await updateTx.wait(1)

  //   // Get the proposalList
  //   const listOfProposal2 = await dao.getProposalsList();
  //   const firstProposal = listOfProposal2[0].toString()
    
  //   // const newAmount = await dao.callStatic.sendLAR(treasury) 



}


export default deployQuadraticVoteFacet

deployQuadraticVoteFacet.tags = ["quadraticVoteFacet", "all"]