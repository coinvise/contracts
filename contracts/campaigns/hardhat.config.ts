import "@nomicfoundation/hardhat-toolbox";
import "@openzeppelin/hardhat-upgrades";
import "@primitivefi/hardhat-dodoc";
import "hardhat-packager";

import "./tasks/accounts";
import "./tasks/deploy";
import "./tasks/upgrade";
import "./tasks/run";

import { resolve } from "path";

import { config as dotenvConfig } from "dotenv";
import { HardhatUserConfig } from "hardhat/config";

import { getHardhatConfig } from "@coinvise/hardhat";

dotenvConfig({ path: resolve(__dirname, "./.env") });

export default getHardhatConfig<HardhatUserConfig>({
  gasReporter: {
    currency: "USD",
    enabled: process.env.REPORT_GAS ? true : false,
    excludeContracts: [],
    src: "./contracts",
    outputFile: ".gas-snapshot",
    noColors: true,
    coinmarketcap: "invalid",
  },
  paths: {
    artifacts: "./artifacts",
    cache: "./cache",
    sources: "./contracts",
    tests: "./test",
  },
  solidity: {
    version: "0.8.19",
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
      /* viaIR: true,
      outputSelection: {
        "*": {
          "*": ["evm.assembly", "irOptimized"],
        },
      }, */
    },
  },
  typechain: {
    outDir: "src/types",
    target: "ethers-v5",
  },
  dodoc: {
    runOnCompile: false,
    include: ["Campaigns", "CampaignsNativeGaslessClaim"],
    outputDir: "docs",
  },
  packager: {
    contracts: ["Campaigns", "CampaignsNativeGaslessClaim"],
    includeFactories: true,
  },
});
