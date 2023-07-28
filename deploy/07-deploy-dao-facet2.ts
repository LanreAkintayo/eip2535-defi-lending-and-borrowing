import { getSelectors, FacetCutAction } from "../utils/diamond"
import { HardhatRuntimeEnvironment } from "hardhat/types"
import { networkConfig, developmentChains } from "../helper-hardhat-config"
import { DeployFunction } from "hardhat-deploy/types"
import { ethers } from "hardhat"
import { ContractTransactionResponse, ZeroAddress } from "ethers"

/*
Deploy the contract first
Add all the selectors inside the diamond and at the same time invoke the  initializeDao(address larTokenAddress) contract address
*/


const deployDaoFacet2:DeployFunction = async function(hre: HardhatRuntimeEnvironment) {

   // @ts-ignore
   const { getNamedAccounts, deployments, network } = hre
   const { deploy, log } = deployments
   const { deployer } = await getNamedAccounts()

   // Deploy the contract first
   log("\n")
   const daoFacetDeployment = await deploy("DaoFacet2", {
    from: deployer,
    args: [],
    log: true,
    // we need to wait if on a live network so we can verify properly
    waitConfirmations: networkConfig[network.name].blockConfirmations || 0,
  })

  


  const daoFacet2 = await ethers.getContract("DaoFacet2") 

  console.log('DaoFacet2 deployed:', daoFacet2.target, "\n")


  // Now let's add all the selectors of the daoFacet2 to the diamond

  const cut = [{
    facetAddress: daoFacet2.target,
    action: FacetCutAction.Add,
    functionSelectors: getSelectors(daoFacet2)
  }]

  // console.log(getSelectors(daoFacet2))

  // Add the Diamond Loupe Facet and at the same time, invoke the init() function inside the DiamontInit contract.
   const diamond = await ethers.getContract('Diamond')
  const diamondCut = await ethers.getContractAt('IDiamondCut', diamond.target)

  console.log("Diamond::::::::::::::: ", diamond)

   let tx
   let receipt


   tx = await diamondCut.diamondCut(cut, ZeroAddress, "0x")
   // console.log('Diamond cut tx: ', tx.hash)
   receipt = await tx.wait() 
   if (!receipt.status) {
     throw Error(`Diamond upgrade failed: ${tx.hash}`)
   }
   console.log('Completed diamond cut')
}


export default deployDaoFacet2

deployDaoFacet2.tags = ["all", "daoFacet2"]