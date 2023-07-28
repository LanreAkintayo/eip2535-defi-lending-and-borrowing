import { getSelectors, FacetCutAction } from "../utils/diamond"
import { HardhatRuntimeEnvironment } from "hardhat/types"
import { networkConfig, developmentChains } from "../helper-hardhat-config"
import { DeployFunction } from "hardhat-deploy/types"
import { ethers } from "hardhat"
import { fromWei, toWei } from "../utils/helper"

const deployDaoAdditionFacet:DeployFunction = async function(hre: HardhatRuntimeEnvironment) {

   // @ts-ignore
   const { getNamedAccounts, deployments, network } = hre
   const { deploy, log } = deployments
   const { deployer, treasury } = await getNamedAccounts()


   const diamond = await ethers.getContract('Diamond')
  //  const diamond = await ethers.getContract('Diamond')


   console.log("Diamond.target", diamond.target)


   // Deploy the contract first
   log("\n")
   const daoFacetDeployment = await deploy("DaoFacet", {
    from: deployer,
    args: [],
    log: true,
    // we need to wait if on a live network so we can verify properly
    waitConfirmations: networkConfig[network.name].blockConfirmations || 0,
  })


  const daoAdditionFacet = await ethers.getContract("DaoFacet") 

  console.log('DaoAdditionFacet deployed:', daoAdditionFacet.target, "\n")

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


    

  // const selectorsToAdd = getSelectors(daoAdditionFacet).get(['getProposalsId()', 'deletePreviousData()'])
  // const selectorToReplace = getSelectors(daoAdditionFacet).get(['deletePreviousData()'])
  const selectorToReplace = getSelectors(daoAdditionFacet).get(['createProposal(string,string,uint256,uint256,uint256,uint256,(uint256,string,uint256)[])'])

  const cut = [
  //   {
  //   facetAddress: daoAdditionFacet.target,
  //   action: FacetCutAction.Add,
  //   functionSelectors: selectorsToAdd
  // },
  {
    facetAddress: daoAdditionFacet.target,
    action: FacetCutAction.Replace,
    functionSelectors: selectorToReplace
  },
]

  // // Add the Diamond Loupe Facet and at the same time, invoke the init() function inside the DiamontInit contract.
  const diamondCut = await ethers.getContractAt('IDiamondCut', diamond.target)

   let tx
   let receipt

  //  // call to init function
   let functionCall = daoAdditionFacet.interface.encodeFunctionData('deletePreviousData()')

   tx = await diamondCut.diamondCut(cut, daoAdditionFacet.target, functionCall)
 
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


export default deployDaoAdditionFacet

deployDaoAdditionFacet.tags = ["daoAdditionFacet"]