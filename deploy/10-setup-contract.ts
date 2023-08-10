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
import { GetterFacet, LAR, TEST1, TEST2 } from "../typechain-types";
import { percentOf, toPercent, toWei } from "../utils/helper";
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

  let lar: LAR = await ethers.getContract("LAR");

  let initializerFacet = await ethers.getContractAt(
    "InitializerFacet",
    diamond.target
  );

  let getterContract = await ethers.getContractAt(
    "GetterFacet",
    diamond.target
  );
  let supplyFacetContract = await ethers.getContractAt(
    "SupplyFacet",
    diamond.target
  );
  // let supply2FacetContract = await ethers.getContractAt(
  //   "Supply2Facet",
  //   diamond.target
  // );

  let tx;
  let receipt;

  // // Initialize Facet
  // tx = await initializerFacet.initializeFacet(lar.target);
  // await tx.wait();

  // set all supported tokens
  let tokens: TokenStruct[];
  let tokenPriceFeeds;
  let test1Contract: TEST1;
  let test2Contract: TEST2;

  if (network.config.chainId == 31337) {
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

    test1Contract = await ethers.getContract("TEST1");
    test2Contract = await ethers.getContract("TEST2");

    tokens = [
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

    tokenPriceFeeds = [
      {
        tokenAddress: test1Contract.target,
        priceFeed: oracle1Contract.target,
      },
      {
        tokenAddress: test2Contract.target,
        priceFeed: oracle2Contract.target,
      },
    ];

    tx = await test1Contract.transfer(diamond.target, toWei(100000));
    await tx.wait();

    tx = await test2Contract.transfer(diamond.target, toWei(100000));
    await tx.wait();
  } else {
    tokens = [
      {
        tokenAddress: networkConfig[network.name].dai,
        liquidationThreshold: toPercent(80),
        loanToValue: toPercent(75),
        borrowStableRate: 1610,
        supplyStableRate: toPercent(10),
        liquidationPenalty: toPercent(1),
      },

      {
        tokenAddress: networkConfig[network.name].link,
        liquidationThreshold: toPercent(65),
        loanToValue: toPercent(50),
        borrowStableRate: 250,
        supplyStableRate: 20,
        liquidationPenalty: 75,
      },

      {
        tokenAddress: networkConfig[network.name].wMatic,
        liquidationThreshold: toPercent(70),
        loanToValue: toPercent(65),
        borrowStableRate: toPercent(5),
        supplyStableRate: 10,
        liquidationPenalty: toPercent(5),
      },

      {
        tokenAddress: networkConfig[network.name].usdc,
        liquidationThreshold: toPercent(85),
        loanToValue: 8250,
        borrowStableRate: toPercent(6),
        supplyStableRate: toPercent(3),
        liquidationPenalty: toPercent(4),
      },

      {
        tokenAddress: networkConfig[network.name].jeur,
        liquidationThreshold: 9750,
        loanToValue: toPercent(97),
        borrowStableRate: toPercent(2),
        supplyStableRate: 10,
        liquidationPenalty: toPercent(1),
      },
    ];

    tokenPriceFeeds = [
      {
        tokenAddress: networkConfig[network.name].dai,
        priceFeed: networkConfig[network.name].daiUsd,
      },
      {
        tokenAddress: networkConfig[network.name].link,
        priceFeed: networkConfig[network.name].linkUsd,
      },
      {
        tokenAddress: networkConfig[network.name].wMatic,
        priceFeed: networkConfig[network.name].maticUsd,
      },
      {
        tokenAddress: networkConfig[network.name].usdc,
        priceFeed: networkConfig[network.name].usdcUsd,
      },
      {
        tokenAddress: networkConfig[network.name].jeur,
        priceFeed: networkConfig[network.name].jeurUsd,
      },
    ];
  }

  tx = await initializerFacet.setAllSupportedTokens(tokens);
  await tx.wait();

  // set token price feeds
  // tx = await initializerFacet.setTokenPriceFeed(tokenPriceFeeds);
  // await tx.wait();

  const allSupportedTokens = await getterContract.getAllSupportedTokens();

  // //Send some LAR Token to the diamond contract
  // tx = await lar.transfer(diamond.target, toWei(400000));
  // await tx.wait();
};

export default setUpContract;

setUpContract.tags = ["all", "setUpContract", "c"];
