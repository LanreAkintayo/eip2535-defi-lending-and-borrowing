import { ethers, getNamedAccounts, network } from "hardhat";
import { toWei } from "../utils/helper";
import { networkConfig } from "../helper-hardhat-config";
import { Diamond, GetterFacet, IBEP20, IDiamond } from "../typechain-types";
import { IERC20 } from "../typechain-types/contracts/interfaces";

async function main() {
  let tx;

  const tokenAddress = networkConfig[network.name].usdc as string;
  const { deployer } = await getNamedAccounts();
  const deployerSigner = await ethers.getSigner(deployer);

  const tokenContract: IBEP20 = await ethers.getContractAt(
    "IBEP20",
    tokenAddress
  );

  const decimals = await tokenContract.decimals();
  const name = await tokenContract.name();
  const tokenAmount = 5n * 10n ** decimals;

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

  const nonce = await tokenContract.nonces(deployer);

  const deadline = Math.floor(Date.now() / 1000) + 4200;

  // Signing message

  console.log("Signing message...");

  // set the domain parameters
  const domain = {
    name: name,
    version: "1",
    chainId: network.config.chainId!,
    verifyingContract: tokenContract.target as string,
  };

  // set the Permit type parameters
  const types = {
    Permit: [
      {
        name: "owner",
        type: "address",
      },
      {
        name: "spender",
        type: "address",
      },
      {
        name: "value",
        type: "uint256",
      },
      {
        name: "nonce",
        type: "uint256",
      },
      {
        name: "deadline",
        type: "uint256",
      },
    ],
  };

  // set the Permit type values
  const values = {
    owner: deployer,
    spender: diamondContract.target,
    value: tokenAmount,
    nonce: nonce,
    deadline: deadline,
  };

  // sign the Permit type data with the deployer's private key
  const signature = await deployerSigner.signTypedData(domain, types, values);

  // split the signature into its components
  const sig = ethers.Signature.from(signature);

  // verify the Permit type data with the signature
  const recovered = ethers.verifyTypedData(domain, types, values, sig);

  console.log("Message signed...");

  console.log("Repaying Token");

  // tx = await diamondContract.repayWithPermit(
  //   tokenAddress,
  //   tokenAmount,
  //   deadline,
  //   sig.v,
  //   sig.r,
  //   sig.s
  // );
  // await tx.wait();

  console.log("Repayed Token");
  // const allSupplies = await getterContract.getAllSupplies(deployer);

  // console.log("Supplied");

  // const firstSupply = allSupplies[0];

  // const daiToUsd = await getterContract.getUsdEquivalence(
  //   tokenAddress,
  //   tokenAmount
  // );

  // console.log("First supplyWithPermit: ", firstSupply);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
