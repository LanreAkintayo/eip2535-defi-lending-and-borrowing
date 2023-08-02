import { AddressLike } from "ethers";

export interface networkConfigItem {
  blockConfirmations: number;
  daiUsd: AddressLike;
  linkUsd: AddressLike;
  maticUsd: AddressLike;
  usdcUsd: AddressLike;
  jeurUsd: AddressLike;
  dai: AddressLike;
  link: AddressLike;
  wMatic: AddressLike;
  usdc: AddressLike;
    jeur: AddressLike;
}

export interface networkConfigInfo {
  [key: string]: networkConfigItem;
}

export const networkConfig: networkConfigInfo = {

  // Price Feed Address, values can be obtained at https://docs.chain.link/docs/reference-contracts
  // Default one is ETH/USD contract on Kovan
  mumbai: {
    blockConfirmations: 6,
    daiUsd: "0x0FCAa9c899EC5A91eBc3D5Dd869De833b06fB046",
    linkUsd: "0x1C2252aeeD50e0c9B64bDfF2735Ee3C932F5C408",
    maticUsd: "0xd0D5e3DB44DE05E9F294BB0a3bEEaF030DE24Ada",
    usdcUsd: "0x572dDec9087154dC5dfBB1546Bb62713147e0Ab0",
    jeurUsd: "0x7d7356bF6Ee5CDeC22B216581E48eCC700D0497A",
    dai: "0xF14f9596430931E177469715c591513308244e8F",  // 18
    link: "0x4e2f1E0dC4EAD962d3c3014e582d974b3cedF743", // 18
    wMatic: "0xf237dE5664D3c2D2545684E76fef02A3A58A364c", // 18
    usdc: "0xe9DcE89B076BA6107Bb64EF30678efec11939234", // 6
    jeur: "0x6bF2BC4BD4277737bd50cF377851eCF81B62e320", //18
  },
};

export const developmentChains = ["hardhat", "localhost"];

export const frontEndContractsFile =
  "../dao-governance-frontend/constants/contractAddresses.json";
export const frontEndAbiFile = "../dao-governance-frontend/constants/abi.json";
