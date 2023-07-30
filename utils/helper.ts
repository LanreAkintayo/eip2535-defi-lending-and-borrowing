import { ethers }  from "hardhat";
import { BigNumberish } from "ethers";


export const toWei =  (value: number):string => {
  return ethers.parseEther(value.toString()).toString()
};

export const toBigInteger = (value: number): bigint => {
  return BigInt(toWei(value));
}

export const fromWei = (amount: BigNumberish): string => {
  return ethers.formatEther(amount)
};

export const fastForwardTheTime = async (valueInSeconds: number) => {
  await ethers.provider.send("evm_increaseTime", [valueInSeconds]);
  await ethers.provider.send("evm_mine",[]) ;
};

export const now = async () => {
  const blockNumber = await ethers.provider.getBlockNumber();
  const block = await ethers.provider.getBlock(blockNumber)
  
  return block ? block.timestamp : 0
}

export const percent = (percentage:number, amount:string) => {
  return (percentage * Number(amount)) / 100;
};

export const sDuration = {
  seconds: function (val: number) {
    return val;
  },
  minutes: function (val: number) {
    return val * this.seconds(60);
  },
  hours: function (val: number) {
    return val * this.minutes(60);
  },
  days: function (val: number) {
    return val * this.hours(24);
  },
  weeks: function (val: number) {
    return val * this.days(7);
  },
  years: function (val: number) {
    return val * this.days(365);
  },
};

export const getContract = async (contractName:string, contractAddress:string) => {
 
  const contractArtifact = await ethers.getContractFactory(contractName);

  // Initialize the contract instance
  const contractInstance = new ethers.Contract(contractAddress, contractArtifact.interface, ethers.provider);
  
  return contractInstance
}



