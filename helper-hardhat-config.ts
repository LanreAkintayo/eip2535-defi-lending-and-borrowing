export interface networkConfigItem {
    blockConfirmations?: number
  }
  
  export interface networkConfigInfo {
    [key: string]:  networkConfigItem
  }

  
export const networkConfig: networkConfigInfo = {
    localhost: {},
    hardhat: {},
    // Price Feed Address, values can be obtained at https://docs.chain.link/docs/reference-contracts
    // Default one is ETH/USD contract on Kovan
    mumbai: {
      blockConfirmations: 6
    },
  }

export const developmentChains = ["hardhat", "localhost"]

export const frontEndContractsFile = "../dao-governance-frontend/constants/contractAddresses.json"
export const frontEndAbiFile = "../dao-governance-frontend/constants/abi.json"
