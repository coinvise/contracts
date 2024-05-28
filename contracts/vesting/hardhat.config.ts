import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-etherscan";
import "@nomiclabs/hardhat-waffle";
import "@openzeppelin/hardhat-upgrades";
import "@typechain/hardhat";
import * as dotenv from "dotenv";
import "hardhat-abi-exporter";
import "hardhat-contract-sizer";
import "hardhat-gas-reporter";
import { HardhatUserConfig } from "hardhat/config";

dotenv.config();

const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      {
        version: "0.8.4",
        settings: {
          optimizer: {
            runs: 200,
            enabled: true,
          },
        },
      },
    ],
  },
  contractSizer: {
    alphaSort: true,
    // runOnCompile: true,
    disambiguatePaths: false,
  },
  abiExporter: {
    path: "./data/abi",
    clear: true,
    flat: true,
    spacing: 2,
  },
  networks: {
    // hardhat: {
    //   // Eth Mainnet
    //   forking: {
    //     url:
    //       "https://eth-mainnet.alchemyapi.io/v2/isjc2sza8ZV0h7V2nNh4Iiey9Y_k6EoW",
    //   },
    //   blockGasLimit: 12500000,
    // },
    mainnet: {
      url: "https://mainnet.infura.io/v3/aa079d178e3c44bb8dd492c3f99bee77",
      chainId: 1,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : "remote",
    },
    ropsten: {
      url: "https://ropsten.infura.io/v3/aa079d178e3c44bb8dd492c3f99bee77",
      chainId: 3,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : "remote",
    },
    rinkeby: {
      url: "https://rinkeby.infura.io/v3/aa079d178e3c44bb8dd492c3f99bee77",
      chainId: 4,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : "remote",
    },
    kovan: {
      url: "https://kovan.infura.io/v3/aa079d178e3c44bb8dd492c3f99bee77",
      chainId: 42,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : "remote",
    },
    goerli: {
      url: "https://goerli.prylabs.net",
      chainId: 5,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : "remote",
    },
    mumbai: {
      url: "https://rpc-mumbai.maticvigil.com",
      chainId: 80001,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : "remote",
    },
    matic: {
      url: "https://polygon-mainnet.g.alchemy.com/v2/1fb8mPS-CiUB7Qe5Zvlj_SIDZTli_2Gw",
      chainId: 137,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : "remote",
    },
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
  },
  typechain: {
    outDir: "typechain",
    target: "ethers-v5",
  },
};

export default config;
