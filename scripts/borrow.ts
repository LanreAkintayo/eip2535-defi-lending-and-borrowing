import { ethers, getNamedAccounts, network } from "hardhat";
import { toWei } from "../utils/helper";
import { networkConfig } from "../helper-hardhat-config";
import { Diamond, GetterFacet, IBEP20, IDiamond } from "../typechain-types";

async function main() {
  let tx;

  const tokenAmount = 2e6
  const tokenAddress = networkConfig[network.name].usdc as string;
  const { deployer } = await getNamedAccounts();

  const tokenContract: IBEP20 = await ethers.getContractAt(
    "IBEP20",
    tokenAddress
  );
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

  console.log("Borrowing Token")

  tx = await diamondContract.borrow(tokenAddress, tokenAmount);
  await tx.wait();

  const allBorrows = await getterContract.getAllBorrows(deployer);

  console.log("Borrowed");

  const firstBorrow = allBorrows[0];

  console.log("First borrow: ", firstBorrow);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
