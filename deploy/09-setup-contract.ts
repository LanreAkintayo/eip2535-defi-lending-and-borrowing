import { getSelectors, FacetCutAction } from "../utils/diamond";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { developmentChains, networkConfig } from "../helper-hardhat-config";
import { DeployFunction } from "hardhat-deploy/types";
import { ethers } from "hardhat";
import { ZeroAddress } from "ethers";
import {
  TokenPriceFeedStruct,
  TokenStruct,
} from "../typechain-types/contracts/facets/InitializerFacet";
import { GetterFacet, LAR } from "../typechain-types";
import { toWei } from "../utils/helper";
// import { GetterFacet } from "../typechain-types";

const setUpContract: DeployFunction = async function (
  hre: HardhatRuntimeEnvironment
) {
  const { getNamedAccounts, deployments, network } = hre;
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();

  const deployerSigner = await ethers.getSigner(deployer);

  console.log("network details: ", [network.name, network.config.chainId]);

  let diamond = await ethers.getContract("Diamond");

  let lar:LAR = await ethers.getContract("LAR");
  let initializerFacet = await ethers.getContractAt(
    "InitializerFacet",
    diamond.target
  );

  let tx;
  let receipt;

  // Initialize Facet
  tx = await initializerFacet.initializeFacet(lar.target);
  await tx.wait();

  // set all supported tokens
  // deploy oracles
  const oracle1 = await deploy("MockOracle", {
    from: deployer,
    args: [1 * 10 ** 8, 8],
    log: true,
    waitConfirmations: 0,
  });

  const oracle2 = await deploy("MockOracle", {
    from: deployer,
    args: [5 * 10 ** 8, 8],
    log: true,
    waitConfirmations: 0,
  });

  const test1 = await deploy("TEST1", {
    from: deployer,
    args: [],
    log: true,
    waitConfirmations: 0,
  });

  const test2 = await deploy("TEST2", {
    from: deployer,
    args: [],
    log: true,
    waitConfirmations: 0,
  });

  // Mock contracts
  const oracle1Contract = await ethers.getContractAt(
    "MockOracle",
    oracle1.address
  );

  const oracle2Contract = await ethers.getContractAt(
    "MockOracle",
    oracle2.address
  );
  const test1Contract = await ethers.getContract("TEST1");
  const test2Contract = await ethers.getContract("TEST2");
  // const getterContract:GetterFacet = await ethers.getContract("GetterFacet");

  const tokens: TokenStruct[] = [
    {
      tokenAddress: test1Contract.target,
      liquidationThreshold: 7000,
      loanToValue: 6000,
      borrowStableRate: 500,
      supplyStableRate: 500,
      liquidationPenalty: 500,
    },
    {
      tokenAddress: test2Contract.target,
      liquidationThreshold: 8250,
      loanToValue: 8000,
      borrowStableRate: 1000,
      supplyStableRate: 1000,
      liquidationPenalty: 500,
    },
  ];

  tx = await initializerFacet.setAllSupportedTokens(tokens);
  await tx.wait();

  // set token price feeds
  const tokenPriceFeeds: TokenPriceFeedStruct[] = [
    {
      tokenAddress: test1Contract.target,
      priceFeed: oracle1Contract.target,
    },
    {
      tokenAddress: test2Contract.target,
      priceFeed: oracle2Contract.target,
    },
  ];

  tx = await initializerFacet.setTokenPriceFeed(tokenPriceFeeds);
  await tx.wait();

    // const allSupportedTokens = await getterContract.getAllSupportedTokens();

    //Send some LAR Token to the diamond contract
  tx = await lar.transfer(diamond.target, toWei(100000))
  await tx.wait()
    
};

export default setUpContract;

setUpContract.tags = ["all", "supplyFacet"];
