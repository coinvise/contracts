import "@nomiclabs/hardhat-etherscan";
import "@nomiclabs/hardhat-waffle";
import "@primitivefi/hardhat-dodoc";
import "@typechain/hardhat";
import "hardhat-gas-reporter";
import "hardhat-packager";
import "solidity-coverage";

import "./tasks/accounts";
import "./tasks/deploy";

import { resolve } from "path";

import { config as dotenvConfig } from "dotenv";
import { HardhatUserConfig } from "hardhat/config";
import { CHAIN_IDS, getAlchemyChainConfig, getInfuraChainConfig } from "./helpers/chains";
import { getEnvVar } from "./helpers/env";

dotenvConfig({ path: resolve(__dirname, "./.env") });

// Ensure that we have all the environment variables we need.
const infuraApiKey: string = getEnvVar("INFURA_API_KEY");
const alchemyApiKey: string = getEnvVar("ALCHEMY_API_KEY");
const mnemonic: string = getEnvVar("MNEMONIC");

const config: HardhatUserConfig = {
  defaultNetwork: "hardhat",
  etherscan: {
    apiKey: {
      arbitrumOne: process.env.ARBSCAN_API_KEY,
      avalanche: process.env.SNOWTRACE_API_KEY,
      bsc: process.env.BSCSCAN_API_KEY,
      goerli: process.env.ETHERSCAN_API_KEY,
      kovan: process.env.ETHERSCAN_API_KEY,
      mainnet: process.env.ETHERSCAN_API_KEY,
      optimisticEthereum: process.env.OPTIMISM_API_KEY,
      polygon: process.env.POLYGONSCAN_API_KEY,
      polygonMumbai: process.env.POLYGONSCAN_API_KEY,
      rinkeby: process.env.ETHERSCAN_API_KEY,
      ropsten: process.env.ETHERSCAN_API_KEY,
    },
  },
  gasReporter: {
    currency: "USD",
    enabled: process.env.REPORT_GAS ? true : false,
    excludeContracts: [],
    src: "./contracts",
  },
  networks: {
    hardhat: {
      accounts: {
        mnemonic,
      },
      chainId: CHAIN_IDS.hardhat,
    },
    arbitrumOne: getInfuraChainConfig("arbitrumOne", infuraApiKey, mnemonic),
    avalanche: getInfuraChainConfig("avalanche", infuraApiKey, mnemonic),
    bsc: getInfuraChainConfig("bsc", infuraApiKey, mnemonic),
    goerli: getInfuraChainConfig("goerli", infuraApiKey, mnemonic),
    kovan: getInfuraChainConfig("kovan", infuraApiKey, mnemonic),
    mainnet: getInfuraChainConfig("mainnet", infuraApiKey, mnemonic),
    optimism: getInfuraChainConfig("optimism", infuraApiKey, mnemonic),
    "polygon-mainnet": getInfuraChainConfig("polygon-mainnet", infuraApiKey, mnemonic),
    "polygon-mumbai": getAlchemyChainConfig("polygon-mumbai", alchemyApiKey, mnemonic),
    rinkeby: getInfuraChainConfig("rinkeby", infuraApiKey, mnemonic),
    ropsten: getInfuraChainConfig("ropsten", infuraApiKey, mnemonic),
  },
  paths: {
    artifacts: "./artifacts",
    cache: "./cache",
    sources: "./contracts",
    tests: "./test",
  },
  solidity: {
    version: "0.8.9",
    settings: {
      metadata: {
        // Not including the metadata hash
        // https://github.com/paulrberg/solidity-template/issues/31
        bytecodeHash: "none",
      },
      // Disable the optimizer when debugging
      // https://hardhat.org/hardhat-network/#solidity-optimizer-support
      optimizer: {
        enabled: true,
        runs: 800,
      },
    },
  },
  typechain: {
    outDir: "src/types",
    target: "ethers-v5",
  },
  dodoc: {
    runOnCompile: false,
    include: ["FWBFestAttendanceNFT"],
    outputDir: "docs",
  },
  packager: {
    contracts: ["FWBFestAttendanceNFT"],
    includeFactories: true,
  },
};

export default config;
