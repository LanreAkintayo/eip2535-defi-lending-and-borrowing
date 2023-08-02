import { ethers, getNamedAccounts, network } from "hardhat";
import { toWei } from "../utils/helper";
import { networkConfig } from "../helper-hardhat-config";
import { Diamond, GetterFacet, IBEP20, IDiamond } from "../typechain-types";

async function main() {
  let tx;

  const { deployer } = await getNamedAccounts();

  const diamond = await ethers.getContract("Diamond");
  const diamondContract: IDiamond = await ethers.getContractAt(
    "IDiamond",
    diamond.target
  );
  const getterContract: GetterFacet = await ethers.getContractAt(
    "GetterFacet",
    diamond.target
  );

  console.log("Diamond.target: ", diamond.target);
  console.log("Deployer: ", deployer);

  console.log("Repaying Token");

  // Get the amount borrowed
  const allBorrows = await getterContract.getAllBorrows(deployer);
  const [
    tokenAddress,
    borrowerAddress,
    amountBorrowed,
    startAccumulatingDay,
    borrowedInterest,
    stableRate,
  ] = allBorrows[0];

  const tokenContract: IBEP20 = await ethers.getContractAt(
    "IBEP20",
    tokenAddress
    );
    
  tx = await tokenContract.approve(diamondContract.target, amountBorrowed + BigInt(5e6));
  await tx.wait(1);

  tx = await diamondContract.repay(tokenAddress, amountBorrowed);
  await tx.wait();

  console.log("Repayed Token");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
