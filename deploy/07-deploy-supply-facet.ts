import { getSelectors, FacetCutAction } from "../utils/diamond";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { networkConfig } from "../helper-hardhat-config";
import { DeployFunction } from "hardhat-deploy/types";
import { ethers } from "hardhat";
import { ZeroAddress } from "ethers";

const deploySupplyFacet: DeployFunction = async function (
  hre: HardhatRuntimeEnvironment
) {
  const { getNamedAccounts, deployments, network } = hre;
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();

  await deploy("SupplyFacet", {
    from: deployer,
    args: [],
    log: true,
    // we need to wait if on a live network so we can verify properly
    waitConfirmations: networkConfig[network.name].blockConfirmations || 0,
  });

  const supplyFacet = await ethers.getContract("SupplyFacet");

  console.log("SupplyFacet deployed:", supplyFacet.target, "\n");

  const supplyFacetFunctionselectors = getSelectors(supplyFacet);

  const cut = [
    {
      facetAddress: supplyFacet.target,
      action: FacetCutAction.Add,
      functionSelectors: supplyFacetFunctionselectors,
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
  console.log("SupplyFacet selector has been cut inside the diamond\n");
};

export default deploySupplyFacet;

deploySupplyFacet.tags = ["all", "supplyFacet"];
