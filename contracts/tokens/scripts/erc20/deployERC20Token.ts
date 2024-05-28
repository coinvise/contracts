require("dotenv").config();
import { parseEther } from "ethers/lib/utils";
import hre, { ethers } from "hardhat";
import config from "../../config/config.json";
import { getArgFromEvent } from "../../test/test-utils";

const deployERC20Token = async (): Promise<string> => {
  let erc20TokenFactory;

  const network = await hre.ethers.provider.getNetwork();

  const [owner] = await hre.ethers.getSigners();

  if (network.chainId === 1) {
    // Ethereum Mainnet
    erc20TokenFactory = config.mainnet.ERC20TokenFactory.address;
  } else if (network.chainId === 5) {
    // Goerli Testnet
    erc20TokenFactory = config.goerli.ERC20TokenFactory.address;
  } else {
    erc20TokenFactory = process.env.ERC20_TOKEN_FACTORY || "";
  }

  const ERC20TokenFactory = await hre.ethers.getContractAt(
    "ERC20TokenFactory",
    erc20TokenFactory
  );

  // Edit following args before running script
  const deployERC20Token = await ERC20TokenFactory.deployERC20Token(
    "TestGoerli",
    "TESTG",
    parseEther("10000"),
    owner.address,
    +new Date()
  );

  const receipt = await deployERC20Token.wait();
  const deployedERC20TokenCloneAddress = getArgFromEvent(
    ERC20TokenFactory,
    receipt,
    ERC20TokenFactory.interface.events["ERC20TokenDeployed(address,address)"]
      .name,
    "_erc20TokenClone"
  );

  const erc20Token = await ethers.getContractAt(
    "ERC20Token",
    deployedERC20TokenCloneAddress
  );

  console.log("ERC20Token clone address: ", erc20Token.address);

  return erc20Token.address;
};

const main = async () => {
  const [owner] = await hre.ethers.getSigners();

  console.log("Deploying contracts with the account:", owner.address);
  console.log(
    `Owner [${owner.address}] Balance:`,
    ethers.utils.formatEther(await owner.getBalance()).toString()
  );

  await deployERC20Token();
};

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
