import { getSelectors, FacetCutAction } from "../utils/diamond"
import { HardhatRuntimeEnvironment } from "hardhat/types"
import { networkConfig, developmentChains } from "../helper-hardhat-config"
import { DeployFunction } from "hardhat-deploy/types"
import { ethers } from "hardhat"


const deployDiamond:DeployFunction = async function(hre: HardhatRuntimeEnvironment) {

   // @ts-ignore
   const { getNamedAccounts, deployments, network } = hre
   const { deploy, log } = deployments
   const { deployer } = await getNamedAccounts()
   const chainId: number = network.config.chainId!

   const diamondCutFacet = await ethers.getContract("DiamondCutFacet");

   const args = [deployer, diamondCutFacet.target]
  
   const diamond = await deploy("Diamond", {
    from: deployer,
    args,
    log: true,
    // we need to wait if on a live network so we can verify properly
    waitConfirmations: networkConfig[network.name].blockConfirmations || 0,
  })

  console.log('Diamond deployed:', diamond.address)

}


export default deployDiamond

deployDiamond.tags = ["all", "all-diamonds", "diamond"]