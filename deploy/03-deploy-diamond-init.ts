import { getSelectors, FacetCutAction } from "../utils/diamond"
import { HardhatRuntimeEnvironment } from "hardhat/types"
import { networkConfig, developmentChains } from "../helper-hardhat-config"
import { DeployFunction } from "hardhat-deploy/types"


const deployDiamondInit:DeployFunction = async function(hre: HardhatRuntimeEnvironment) {


   const { getNamedAccounts, deployments, network } = hre
   const { deploy, log } = deployments
   const { deployer } = await getNamedAccounts()
   const chainId: number = network.config.chainId!

   const diamondInit = await deploy("DiamondInit", {
     from: deployer,
     args: [],
     log: true,
     // we need to wait if on a live network so we can verify properly
     waitConfirmations:
       chainId == 31337 ? 0 : networkConfig[network.name].blockConfirmations,
   });

  console.log('DiamondInit deployed:', diamondInit.address, "\n")

}


export default deployDiamondInit

deployDiamondInit.tags = ["all", "all-diamonds", "diamondInit"]