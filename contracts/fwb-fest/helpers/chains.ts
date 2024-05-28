import { NetworkUserConfig } from "hardhat/types";

export const CHAIN_IDS = {
  arbitrumOne: 42161,
  avalanche: 43114,
  bsc: 56,
  goerli: 5,
  hardhat: 31337,
  kovan: 42,
  mainnet: 1,
  optimism: 10,
  "polygon-mainnet": 137,
  "polygon-mumbai": 80001,
  rinkeby: 4,
  ropsten: 3,
};

export function getInfuraChainConfig(
  network: keyof typeof CHAIN_IDS,
  infuraApiKey: string,
  mnemonic: string,
): NetworkUserConfig {
  const url: string = "https://" + network + ".infura.io/v3/" + infuraApiKey;
  return {
    accounts: {
      count: 10,
      mnemonic,
      path: "m/44'/60'/0'/0",
    },
    chainId: CHAIN_IDS[network],
    url,
  };
}

export function getAlchemyChainConfig(
  network: keyof typeof CHAIN_IDS,
  alchemyApiKey: string,
  mnemonic: string,
): NetworkUserConfig {
  const url: string = "https://" + network + ".g.alchemy.com/v2/" + alchemyApiKey;
  return {
    accounts: {
      count: 10,
      mnemonic,
      path: "m/44'/60'/0'/0",
    },
    chainId: CHAIN_IDS[network],
    url,
  };
}
