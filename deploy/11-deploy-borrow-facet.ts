import { getSelectors, FacetCutAction } from "../utils/diamond";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { networkConfig } from "../helper-hardhat-config";
import { DeployFunction } from "hardhat-deploy/types";
import { ethers } from "hardhat";
import { ZeroAddress } from "ethers";

const deployBorrowFacet: DeployFunction = async function (
  hre: HardhatRuntimeEnvironment
) {
  const { getNamedAccounts, deployments, network } = hre;
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = await network.config.chainId

  await deploy("BorrowFacet", {
    from: deployer,
    args: [],
    log: true,
    // we need to wait if on a live network so we can verify properly
    waitConfirmations:
      chainId == 31337 ? 0 : networkConfig[network.name].blockConfirmations,
  });

  const borrowFacet = await ethers.getContract("BorrowFacet");

  console.log("BorrowFacet deployed:", borrowFacet.target, "\n");

  const borrowFacetFunctionselectors = getSelectors(borrowFacet);

  const cut = [
    {
      facetAddress: borrowFacet.target,
      action: FacetCutAction.Add,
      functionSelectors: borrowFacetFunctionselectors,
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
  console.log("BorrowFacet selector has been cut inside the diamond\n");
};

export default deployBorrowFacet;

deployBorrowFacet.tags = ["all", "borrowFacet", "a"];
