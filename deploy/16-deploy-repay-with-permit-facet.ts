import { getSelectors, FacetCutAction } from "../utils/diamond";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { networkConfig } from "../helper-hardhat-config";
import { DeployFunction } from "hardhat-deploy/types";
import { ethers } from "hardhat";
import { ZeroAddress } from "ethers";

const deployRepayWithPermitFacet: DeployFunction = async function (
  hre: HardhatRuntimeEnvironment
) {
  const { getNamedAccounts, deployments, network } = hre;
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = await network.config.chainId;

  await deploy("RepayWithPermitFacet", {
    from: deployer,
    args: [],
    log: true,
    // we need to wait if on a live network so we can verify properly
    waitConfirmations:
      chainId == 31337 ? 0 : networkConfig[network.name].blockConfirmations,
  });

  const repayWithPermitFacet = await ethers.getContract("RepayWithPermitFacet");

  console.log("RepayWithPermitFacet deployed:", repayWithPermitFacet.target, "\n");

  //   const repayFacetFunctionselectors = getSelectors(repayWithPermitFacet)
  const repayFacetFunctionselectors = getSelectors(repayWithPermitFacet).remove([
    "indexOf(address,(address,address,uint256,uint256,uint256,uint256)[])",
  ]);

  const cut = [
    {
      facetAddress: repayWithPermitFacet.target,
      action: FacetCutAction.Add,
      functionSelectors: repayFacetFunctionselectors,
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
  console.log("RepayWithPermit selector has been cut inside the diamond\n");
};

export default deployRepayWithPermitFacet;

deployRepayWithPermitFacet.tags = ["all", "repayWithPermitFacet", "a"];
