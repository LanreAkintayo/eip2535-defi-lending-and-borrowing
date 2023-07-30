import { developmentChains } from "../../helper-hardhat-config";
import {
  network,
  deployments,
  ethers,
  getNamedAccounts,
  getUnnamedAccounts,
} from "hardhat";
import {
  now,
  sDuration,
  toWei,
  fromWei,
  fastForwardTheTime,
  toBigInteger,
} from "../../utils/helper";
import {
  Diamond,
  GetterFacet,
  IDiamond,
  InitializerFacet,
  LAR,
  SupplyFacet,
  TEST1,
  TEST2,
} from "../../typechain-types/index.js";
import {
  ContractTransaction,
  ContractTransactionReceipt,
  ContractTransactionResponse,
  Signer,
} from "ethers";
import { assert, expect } from "chai";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

interface Option {
  index: number;
  optionText: string;
  vote: number;
}

describe.only("SupplyFacet", function () {
  let supplyFacet: SupplyFacet;
  let initializerFacet: InitializerFacet;
  let diamond: Diamond;
  let lar: LAR;
  let test1Contract: TEST1;
  let test2Contract: TEST2;
  let diamondContract: IDiamond;
  // let getterContract: GetterFacet;
  let deployer: string;
  let deployerSigner: Signer;
  let user1: SignerWithAddress,
    user2: SignerWithAddress,
    user3: SignerWithAddress,
    user4: SignerWithAddress;
  let title: string,
    description: string,
    proposalStatus: number,
    startDate: number,
    duration: number,
    options: Option[];

  beforeEach(async function () {
    deployer = (await getNamedAccounts()).deployer;
    const users = await getUnnamedAccounts();
    deployerSigner = await ethers.getSigner(deployer);
    user1 = await ethers.getSigner(users[0]);
    user2 = await ethers.getSigner(users[1]);
    user3 = await ethers.getSigner(users[2]);
    user4 = await ethers.getSigner(users[3]);

    if (developmentChains.includes(network.name)) {
      await deployments.fixture(["all"]);
    }

    diamond = await ethers.getContract("Diamond");
    supplyFacet = await ethers.getContractAt("SupplyFacet", diamond.target);
    lar = await ethers.getContract("LAR");
    initializerFacet = await ethers.getContractAt(
      "InitializerFacet",
      diamond.target
    );
    test1Contract = await ethers.getContract("TEST1");
    test2Contract = await ethers.getContract("TEST2");
    diamondContract = await ethers.getContractAt("IDiamond", diamond.target);

    // Supply a token
    // Supply some tokens after approval
    let tx;
    let receipt;

    const tokenAmount = toWei(100);
    const tokenAddress = test1Contract.target;

    tx = await test1Contract.approve(diamondContract.target, tokenAmount);
    await tx.wait(1);

    tx = await diamondContract.supplyToken(tokenAddress, tokenAmount);
    await tx.wait();
  });

  describe("SupplyFacet", function () {
    it("should be able to withdraw from user's account", async () => {
      let tx;

      const test2BalanceBefore = await test2Contract.balanceOf(deployer);

      const tokenAmount = toWei(100);
      const tokenAddress = test2Contract.target;

      tx = await test2Contract.approve(diamondContract.target, tokenAmount);
      await tx.wait(1);

      tx = await diamondContract.supplyToken(tokenAddress, tokenAmount);
      await tx.wait();

      const test2BalanceAfter = await test2Contract.balanceOf(deployer);

      assert.equal(test2BalanceAfter, test2BalanceBefore - toBigInteger(100));
    });

    it("should be able to get all supplied tokens", async () => {
      const allSupplies = await diamondContract.getAllSupplies(deployer);
      const allSuppliers = await diamondContract.getAllSuppliers();

      assert.equal(allSuppliers.length, 1);
      assert.equal(allSupplies.length, 1);
    });

    it("should be able to add more supplies", async () => {
      let tx;

      const tokenAmount = toWei(100);
      const tokenAddress = test2Contract.target;

      tx = await test2Contract.approve(diamondContract.target, tokenAmount);
      await tx.wait(1);

      tx = await diamondContract.supplyToken(tokenAddress, tokenAmount);
      await tx.wait();

      const allSupplies = await diamondContract.getAllSupplies(deployer);

      assert.equal(allSupplies.length, 2);

      const allSuppliers = await diamondContract.getAllSuppliers();
      assert.equal(allSuppliers.length, 1);
    });

    it("should be able to update the amount supplied", async () => {
      let allSupplies;

      allSupplies = await diamondContract.getAllSupplies(deployer);
      const [, , amountSupplied1, , , , ,] = allSupplies[0];

      assert.equal(amountSupplied1, toBigInteger(100));

      let tx;
      let receipt;

      const tokenAmount = toWei(300);

      tx = await test1Contract.approve(diamondContract.target, tokenAmount);
      await tx.wait(1);

      tx = await diamondContract.supplyToken(test1Contract.target, tokenAmount);
      await tx.wait();

      allSupplies = await diamondContract.getAllSupplies(deployer);
      const [, , amountSupplied2, , , , ,] = allSupplies[0];

      assert.equal(amountSupplied2, toBigInteger(400));
      assert.equal(allSupplies.length, 1);
    });
  });
});
