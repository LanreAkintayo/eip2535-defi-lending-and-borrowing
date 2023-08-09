import { getSelectors, FacetCutAction } from "../utils/diamond";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { networkConfig } from "../helper-hardhat-config";
import { DeployFunction } from "hardhat-deploy/types";
import { ethers } from "hardhat";
import { ZeroAddress } from "ethers";

const deployGetterFacet: DeployFunction = async function (
  hre: HardhatRuntimeEnvironment
) {
  const { getNamedAccounts, deployments, network } = hre;
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = await network.config.chainId;

  await deploy("GetterFacet", {
    from: deployer,
    args: [],
    log: true,
    // we need to wait if on a live network so we can verify properly
    waitConfirmations:
      chainId == 31337 ? 0 : networkConfig[network.name].blockConfirmations,
  });

  const getterFacet = await ethers.getContract("GetterFacet");

  console.log("GetterFacet deployed:", getterFacet.target, "\n");

  const getterFacetFunctionselectors = getSelectors(getterFacet).get([
    "getCurrentLTV(address)",
    "getBorrowPower(address)",
  ]);

  const cut = [
    {
      facetAddress: getterFacet.target,
      action: FacetCutAction.Replace,
      functionSelectors: getterFacetFunctionselectors,
    },
  ];

  // Cut all its functions inside the diamond.
  const diamond = await ethers.getContract("Diamond");
  const diamondCut = await ethers.getContractAt("IDiamondCut", diamond.target);

  const tx = await diamondCut.diamondCut(cut, ZeroAddress, "0x");
  const receipt = await tx.wait();

  if (!receipt?.status) {
    throw Error(`Diamond upgrade failed: ${tx.hash}`);
  }
  console.log("GetterFacet selector has been cut inside the diamond\n");
};

export default deployGetterFacet;

deployGetterFacet.tags = ["updateGetterFacet"];
