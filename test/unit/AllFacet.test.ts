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
  percentOf,
} from "../../utils/helper";
import {
  Diamond,
  GetterFacet,
  IDiamond,
  InitializerFacet,
  LAR,
  RepayFacet,
  SupplyFacet,
  TEST1,
  TEST2,
  WithdrawFacet,
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

describe.only("All Facets", function () {
  let supplyFacet: SupplyFacet;
  let initializerFacet: InitializerFacet;
  let withdrawFacet: WithdrawFacet;
  let repayFacet: RepayFacet;
  let diamond: Diamond;
  let lar: LAR;
  let test1Contract: TEST1;
  let test2Contract: TEST2;
  let diamondContract: IDiamond;
  let getterContract: GetterFacet;
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
    withdrawFacet = await ethers.getContract("WithdrawFacet");
    repayFacet = await ethers.getContract("RepayFacet");
    getterContract = await ethers.getContractAt("GetterFacet", diamond.target);
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
      const allSupplies = await getterContract.getAllSupplies(deployer);
      const allSuppliers = await getterContract.getAllSuppliers();

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

      const allSupplies = await getterContract.getAllSupplies(deployer);

      assert.equal(allSupplies.length, 2);

      const allSuppliers = await getterContract.getAllSuppliers();
      assert.equal(allSuppliers.length, 1);
    });

    it("should be able to update the amount supplied", async () => {
      let allSupplies;

      allSupplies = await getterContract.getAllSupplies(deployer);
      const [, , amountSupplied1, , , , ,] = allSupplies[0];

      assert.equal(amountSupplied1, toBigInteger(100));

      let tx;
      let receipt;

      const tokenAmount = toWei(300);

      tx = await test1Contract.approve(diamondContract.target, tokenAmount);
      await tx.wait(1);

      tx = await diamondContract.supplyToken(test1Contract.target, tokenAmount);
      await tx.wait();

      allSupplies = await getterContract.getAllSupplies(deployer);
      const [, , amountSupplied2, , , , ,] = allSupplies[0];

      assert.equal(amountSupplied2, toBigInteger(400));
      assert.equal(allSupplies.length, 1);
    });

    it("should be able to update user's collateral", async () => {
      const currentCollateral =
        await getterContract.getUserTotalCollateralInUsd(deployer);
      let tx;

      assert.equal(currentCollateral, BigInt(100e18));

      // Supply more of TEST2
      const tokenAmount = toWei(200);
      const tokenAddress = test2Contract.target;

      tx = await test2Contract.approve(diamondContract.target, tokenAmount);
      await tx.wait(1);

      tx = await diamondContract.supplyToken(tokenAddress, tokenAmount);
      await tx.wait();

      const newCollateral = await getterContract.getUserTotalCollateralInUsd(
        deployer
      );

      assert.equal(newCollateral, BigInt(100e18) + BigInt(1000e18));
    });
  });

  describe("BorrowFacet", function () {
    it("should be able to borrow from the pool", async () => {
      let tx;

      // Check user's current collateral
      const currentCollateral = fromWei(
        await getterContract.getUserTotalCollateralInUsd(deployer)
      );
      // console.log("Current user's total collateral: ", currentCollateral);

      const usdPrice = toWei(60);
      const tokenAmountToBorrow = await getterContract.convertUsdToToken(
        test1Contract.target,
        usdPrice
      );

      tx = await diamondContract.borrow(
        test1Contract.target,
        percentOf(99, tokenAmountToBorrow)
      );

      await tx.wait();

      // Let's determine the liquidation threshold

      // Let's calculate the health factor

      const currentHealthFactor = await getterContract.getHealthFactor(
        deployer
      );

      // Let's borrow more;

      //   const test2BalanceBefore = await test2Contract.balanceOf(deployer);

      //   const tokenAmount = toWei(100);
      //   const tokenAddress = test2Contract.target;

      //   tx = await test2Contract.approve(diamondContract.target, tokenAmount);
      //   await tx.wait(1);

      //   tx = await diamondContract.supplyToken(tokenAddress, tokenAmount);
      //   await tx.wait();

      //   const test2BalanceAfter = await test2Contract.balanceOf(deployer);

      //   assert.equal(test2BalanceAfter, test2BalanceBefore - toBigInteger(100));
    });

    it("should be able to update the Appstorage", async () => {
      let tx;

      // Check list of all borrowers before borrowing
      const allBorrowersBefore = await getterContract.getAllBorrowers();
      assert.equal(allBorrowersBefore.length, 0);

      const usdPrice = toWei(60);
      const tokenAmountToBorrow = await getterContract.convertUsdToToken(
        test1Contract.target,
        usdPrice
      );

      tx = await diamondContract.borrow(
        test1Contract.target,
        percentOf(99, tokenAmountToBorrow)
      );

      await tx.wait();

      //Check list of all borrowers after borrowing
      const allBorrowersAfter = await getterContract.getAllBorrowers();
      assert.equal(allBorrowersAfter.length, 1);
    });

    it("should be able to determine weighted liquidation threshold and health factor", async () => {
      let tx;
      // Supply TEST2
      const tokenAmount = toWei(300);

      tx = await test2Contract.approve(diamondContract.target, tokenAmount);
      await tx.wait(1);

      tx = await diamondContract.supplyToken(test2Contract.target, tokenAmount);
      await tx.wait();

      const test1ToUsd = await getterContract.getUsdEquivalence(
        test1Contract.target,
        toWei(100)
      );

      const test2ToUsd = await getterContract.getUsdEquivalence(
        test2Contract.target,
        toWei(300)
      );

      const summation = test1ToUsd + test2ToUsd;

      const userTotalCollateralInUsd =
        await getterContract.getUserTotalCollateralInUsd(deployer);

      assert.equal(summation, BigInt(toWei(1600)));
      assert.equal(summation, userTotalCollateralInUsd);

      // Let's determine the total amount in USD you can borrow.
      const userTotalBorrowedInUsd =
        await getterContract.getUserTotalBorrowedInUsd(deployer);

      const expectedMaxAvailableToBorrowInUsd =
        percentOf(60, test1ToUsd) +
        percentOf(80, test2ToUsd) -
        userTotalBorrowedInUsd;

      // console.log(
      //   "Expected maximum available to borrow: ",
      //   fromWei(expectedMaxAvailableToBorrowInUsd)
      // );

      const maxAvailableToBorrowInUsd =
        await getterContract.getMaxAvailableToBorrowInUsd(deployer);

      assert.equal(
        expectedMaxAvailableToBorrowInUsd,
        maxAvailableToBorrowInUsd
      );

      // Liquidation threshold weighted
      const expectedLiquidationThresholdWeighted =
        (7000n * test1ToUsd + 8250n * test2ToUsd) / userTotalCollateralInUsd;

      const actualLiquidationThresholdWeighted =
        await getterContract.getLiquidationThreshold(deployer);

      assert.equal(
        expectedLiquidationThresholdWeighted,
        actualLiquidationThresholdWeighted
      );

      // Health factor before borrowing

      const healthFactorBefore = -1n;
      const contractHealthFactorBefore = await getterContract.getHealthFactor(
        deployer
      );

      assert.equal(healthFactorBefore, contractHealthFactorBefore);

      console.log("Health factor before: ", healthFactorBefore / 100n);

      // Let's borrow
      const tokenAmountToBorrow = await getterContract.convertUsdToToken(
        test1Contract.target,
        expectedMaxAvailableToBorrowInUsd
      );

      tx = await diamondContract.borrow(
        test1Contract.target,
        percentOf(100.0, tokenAmountToBorrow)
      );

      await tx.wait();

      const newUserTotalBorrowedInUsd =
        await getterContract.getUserTotalBorrowedInUsd(deployer);
      assert.equal(
        expectedMaxAvailableToBorrowInUsd,
        newUserTotalBorrowedInUsd
      );

      const healthFactorAfter =
        (userTotalCollateralInUsd * actualLiquidationThresholdWeighted) /
        newUserTotalBorrowedInUsd;
      const contractHealthFactorAfter = await getterContract.getHealthFactor(
        deployer
      );

      assert.equal(healthFactorAfter, contractHealthFactorAfter);
      console.log("Healthfactor after: ", Number(healthFactorAfter) / 10000);
    });
  });

  describe("WithdrawFacet", function () {
    it("should be able to withdraw tokens ", async () => {
      let tx;

      const tokentoWithdraw = toWei(100);

      const deployerBalanceBefore = await test1Contract.balanceOf(deployer);
      const larTokenBefore = await lar.balanceOf(deployer);

      tx = await diamondContract.withdraw(
        test1Contract.target,
        tokentoWithdraw
      );
      await tx.wait();

      const deployerBalanceAfter = await test1Contract.balanceOf(deployer);
      const larTokenAfter = await lar.balanceOf(deployer);

      assert.equal(larTokenBefore, larTokenAfter + BigInt(toWei(100)));
      assert.equal(
        deployerBalanceAfter,
        deployerBalanceBefore + BigInt(toWei(100))
      );
    });

    it("should be able to withdraw the right amount of token after borrow ", async () => {
      let tx;

      // Borrow some TEST2 token

      const tokenToBorrow = toWei(10);

      tx = await diamondContract.borrow(test2Contract.target, tokenToBorrow);
      await tx.wait();

      // Check the amount of TEST1 token you can withdraw

      const tokenToWithdraw = toWei(100);

      await expect(
        diamondContract.withdraw(test1Contract.target, tokenToWithdraw)
      ).to.be.revertedWithCustomError(withdrawFacet, "CannotWithdrawAmount");
      await tx.wait();
    });

    it("should be able to swith off collateral", async () => {
      // switch off the collateral
      let tx;

      const userTokensSuppliedBefore = await getterContract.getAllSupplies(
        deployer
      );

      const [
        ,
        ,
        amountSuppliedBefore,
        supplyInterestBefore,
        ,
        startAccumulatingDayBefore,
        isCollateralBefore,
      ] = userTokensSuppliedBefore[0];

      assert.equal(supplyInterestBefore, 0n);
      assert.equal(startAccumulatingDayBefore, 0n);
      assert.equal(isCollateralBefore, true);

      tx = await diamondContract.swithOffCollateral(test1Contract.target);
      await tx.wait(1);

      const userTokensSuppliedAfter = await getterContract.getAllSupplies(
        deployer
      );

      const [
        ,
        ,
        amountSuppliedAfter,
        supplyInterestAfter,
        ,
        startAccumulatingDayAfter,
        isCollateralAfter,
      ] = userTokensSuppliedAfter[0];

      assert.equal(supplyInterestAfter, BigInt(toWei(5)));
      assert.equal(isCollateralAfter, false);

      // Try to withdraw after some  minutes
      await fastForwardTheTime(sDuration.days(20));

      // Withdraw and check the total returned.
      const deployerBalanceBefore = await test1Contract.balanceOf(deployer);

      tx = await diamondContract.withdraw(test1Contract, toWei(100));
      await tx.wait();

      const deployerBalanceAfter = await test1Contract.balanceOf(deployer);

      const dailyInterest = supplyInterestAfter / 365n;

      // The difference should be very small
      expect(deployerBalanceAfter).to.be.greaterThan(
        deployerBalanceBefore + amountSuppliedAfter + dailyInterest * 20n
      );
      expect(deployerBalanceAfter).to.be.lessThan(
        deployerBalanceBefore + amountSuppliedAfter + dailyInterest * 20n + 10n
      );
    });
  });

  describe("RepayFacet", function () {
    it("should be able to repay borrowed tokens ", async () => {
      let tx;

      const tokenToRepay = toWei(100);

      await expect(
        diamondContract.repay(test1Contract.target, tokenToRepay)
      ).to.be.revertedWithCustomError(repayFacet, "TokenNotBorrowed");

      // Let's borrow some TEST1 token and then repay it after 10 days
      const tokenToBorrow = toWei(40);
      tx = await diamondContract.borrow(test1Contract.target, tokenToBorrow);
      await tx.wait();

      // Let's fast forward the date to 10 days
      await fastForwardTheTime(sDuration.days(10));

      // Let's repay after 10 days
      const userTokensBorrowedAfter = await getterContract.getAllBorrows(
        deployer
      );

      const [
        tokenAddress,
        borrowerAddress,
        amountBorrowed,
        startAccumulatingDay,
        borrowedInterest,
        stableRate,
      ] = userTokensBorrowedAfter[0];

      const deployerBalanceBefore = await test1Contract.balanceOf(deployer);

      // Let's approve the contract to spend some of our tokens
      tx = await test1Contract.approve(
        diamondContract.target,
        BigInt(tokenToBorrow) + BigInt(toWei(20))
      );
      await tx.wait();

      tx = await diamondContract.repay(test1Contract.target, tokenToBorrow);
      await tx.wait();

      const deployerBalanceAfter = await test1Contract.balanceOf(deployer);

      const dailyInterest = (amountBorrowed * 500n) / (365n * 10000n);
      const accumulatedInterest = dailyInterest * 10n;

      expect(deployerBalanceBefore).to.be.greaterThan(
        deployerBalanceAfter + accumulatedInterest + BigInt(tokenToBorrow)
      );
      expect(deployerBalanceBefore).to.be.lessThan(
        deployerBalanceAfter + accumulatedInterest + BigInt(tokenToBorrow) + 10n
      );
    });
  });
});
