import { HardhatRuntimeEnvironment } from "hardhat/types"
import { DeployFunction } from "hardhat-deploy/types"
// import verify from "../utils/verify"
import { developmentChains, networkConfig } from "../helper-hardhat-config"
import { ethers } from "hardhat"


const deployLAR: DeployFunction = async function (
  hre: HardhatRuntimeEnvironment
) {
  // @ts-ignore
  const { getNamedAccounts, deployments, network } = hre
  const { deploy, log } = deployments
  const { deployer } = await getNamedAccounts()
  const chainId: number = network.config.chainId!


  const larDeployment = await deploy("LAR", {
    from: deployer,
    args: [],
    log: true,
    // we need to wait if on a live network so we can verify properly
    waitConfirmations: networkConfig[network.name].blockConfirmations || 0,
  })

  log(`Lar deployed at ${larDeployment.address}`)

  


//   if (
//     !developmentChains.includes(network.name) &&
//     process.env.ETHERSCAN_API_KEY
//   ) {
//     await verify(fundMe.address, [ethUsdPriceFeedAddress])
//   }
}
export default deployLAR
deployLAR.tags = ["all", "lar"]