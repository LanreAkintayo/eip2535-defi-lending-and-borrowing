import { HardhatRuntimeEnvironment } from "hardhat/types"
import { networkConfig, developmentChains } from "../helper-hardhat-config"
import { DeployFunction } from "hardhat-deploy/types"


const deployDiamondCutFacet:DeployFunction = async function(hre: HardhatRuntimeEnvironment) {

   // @ts-ignore
   const { getNamedAccounts, deployments, network } = hre
   const { deploy, log } = deployments
   const { deployer } = await getNamedAccounts()
  
   const diamondCutFacet = await deploy("DiamondCutFacet", {
    from: deployer,
    args: [],
    log: true,
    // we need to wait if on a live network so we can verify properly
    waitConfirmations: networkConfig[network.name].blockConfirmations || 0,
  })

  log('DiamondCutFacet deployed:', diamondCutFacet.address)

}


export default deployDiamondCutFacet

deployDiamondCutFacet.tags = ["all", "all-diamonds", "diamondCutFacet"]