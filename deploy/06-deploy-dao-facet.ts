import { getSelectors, FacetCutAction } from "../utils/diamond"
import { HardhatRuntimeEnvironment } from "hardhat/types"
import { networkConfig, developmentChains } from "../helper-hardhat-config"
import { DeployFunction } from "hardhat-deploy/types"
import { ethers } from "hardhat"

/*
Deploy the contract first
Add all the selectors inside the diamond and at the same time invoke the  initializeDao(address larTokenAddress) contract address
*/


const deployDaoFacet:DeployFunction = async function(hre: HardhatRuntimeEnvironment) {

   // @ts-ignore
   const { getNamedAccounts, deployments, network } = hre
   const { deploy, log } = deployments
   const { deployer } = await getNamedAccounts()

   // Deploy the contract first
   log("\n")
   const daoFacetDeployment = await deploy("DaoFacet", {
    from: deployer,
    args: [],
    log: true,
    // we need to wait if on a live network so we can verify properly
    waitConfirmations: networkConfig[network.name].blockConfirmations || 0,
  })


  const daoFacet = await ethers.getContract("DaoFacet") 

  console.log('DaoFacet deployed:', daoFacet.target, "\n")


  // Now let's add all the selectors of the daoFacet to the diamond

  const selectors = getSelectors(daoFacet)


  const cut = [{
    facetAddress: daoFacet.target,
    action: FacetCutAction.Add,
    functionSelectors: getSelectors(daoFacet)
  }]

  // console.log(getSelectors(daoFacet))

  // Add the Diamond Loupe Facet and at the same time, invoke the init() function inside the DiamontInit contract.
   const diamond = await ethers.getContract('Diamond')
  const diamondCut = await ethers.getContractAt('IDiamondCut', diamond.target)
  const lar = await ethers.getContract('LAR')

   let tx
   let receipt
    // call to init function
    let functionCall = daoFacet.interface.encodeFunctionData('initializeDao(address)', [lar.target])
 
   console.log("Function call: ", functionCall)

   tx = await diamondCut.diamondCut(cut, daoFacet.target, functionCall)
   // console.log('Diamond cut tx: ', tx.hash)
   receipt = await tx.wait()
   if (!receipt?.status) {
     throw Error(`Diamond upgrade failed: ${tx.hash}`)
   }
   console.log('Completed diamond cut')
}


export default deployDaoFacet

deployDaoFacet.tags = ["all", "daoFacet"]