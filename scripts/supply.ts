

import { ethers, getNamedAccounts, network } from "hardhat";
import { toWei } from "../utils/helper";
import { networkConfig } from "../helper-hardhat-config";
import { Diamond, GetterFacet, IBEP20, IDiamond } from "../typechain-types";

async function main() {
    let tx;

    const tokenAmount = toWei(50);
    const tokenAddress = networkConfig[network.name].dai as string;
    const { deployer } = await getNamedAccounts();

    const tokenContract: IBEP20 = await ethers.getContractAt("IBEP20", tokenAddress);
    const diamond = await ethers.getContract("Diamond");
    const diamondContract:IDiamond = await ethers.getContractAt("IDiamond", diamond.target);
    const getterContract:GetterFacet = await ethers.getContractAt("GetterFacet", diamond.target);

    // tx = await tokenContract.approve(diamondContract.target, tokenAmount);
    // await tx.wait(1);

    // console.log("Supplying Token")

    // tx = await diamondContract.supplyToken(tokenAddress, tokenAmount);
    // await tx.wait();

    const allSupplies = await getterContract.getAllSupplies(deployer);

    console.log("Supplied");


    const firstSupply = allSupplies[0]

    console.log("First supply: ", firstSupply)

  
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
