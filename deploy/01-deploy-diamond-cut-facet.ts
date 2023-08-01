import { HardhatRuntimeEnvironment } from "hardhat/types"
import { networkConfig, developmentChains } from "../helper-hardhat-config"
import { DeployFunction } from "hardhat-deploy/types"


const deployDiamondCutFacet:DeployFunction = async function(hre: HardhatRuntimeEnvironment) {

   const { getNamedAccounts, deployments, network } = hre
   const { deploy, log } = deployments
  const { deployer } = await getNamedAccounts()
  const chainId = network.config.chainId
  
   const diamondCutFacet = await deploy("DiamondCutFacet", {
    from: deployer,
    args: [],
    log: true,
    // we need to wait if on a live network so we can verify properly
    waitConfirmations: chainId == 31337 ? 0 : networkConfig[network.name].blockConfirmations,
  })

  log('DiamondCutFacet deployed:', diamondCutFacet.address)

}


export default deployDiamondCutFacet

deployDiamondCutFacet.tags = ["all", "all-diamonds", "diamondCutFacet"]