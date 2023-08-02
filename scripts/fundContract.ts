import { ethers, getNamedAccounts, network } from "hardhat";
import { toWei } from "../utils/helper";
import { networkConfig } from "../helper-hardhat-config";
import { Diamond, GetterFacet, IBEP20, IDiamond } from "../typechain-types";

async function main() {
  let tx;

  const fundsAccount = "0x5709666308b6d4a7129aCc66d2237beE65083097";

  const daiAmount = toWei(50);
  const linkAmount = toWei(50);
  const wMaticAmount = toWei(50);
  const usdcAmount = 50e6;
  const jeurAmount = toWei(50);

  const tokenAddresses = [
    networkConfig[network.name].dai,
    networkConfig[network.name].link,
    networkConfig[network.name].wMatic,
    networkConfig[network.name].usdc,
    networkConfig[network.name].jeur,
  ] as string[];

  const tokenAmount = [
    daiAmount,
    linkAmount,
    wMaticAmount,
    usdcAmount,
    jeurAmount,
  ];

  const fundsSigner = await ethers.getSigner(fundsAccount);

  const diamond = await ethers.getContract("Diamond");
  const diamondContract: IDiamond = await ethers.getContractAt(
    "IDiamond",
    diamond.target
  );
  const getterContract: GetterFacet = await ethers.getContractAt(
    "GetterFacet",
    diamond.target
  );

  for (let i = 0; i < tokenAddresses.length - 2; i++) {
    const tokenContract: IBEP20 = await ethers.getContractAt(
      "IBEP20",
      tokenAddresses[i]
    );

    console.log(`Transferring ${tokenAmount[i]} ${await tokenContract.name()}`);

    tx = await tokenContract
      .connect(fundsSigner)
      .transfer(diamond.target, tokenAmount[i]);
    await tx.wait();

    console.log("Transferred.");
  }

  console.log("Funded...");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
