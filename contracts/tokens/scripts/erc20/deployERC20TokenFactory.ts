import hre, { ethers } from "hardhat";

const deployERC20TokenLogic = async (): Promise<string> => {
  const ERC20Token = await ethers.getContractFactory("ERC20Token");
  const ERC20TokenLogic = await ERC20Token.deploy();
  console.log("ERC20Token logic address: ", ERC20TokenLogic.address);

  await ERC20TokenLogic.deployTransaction.wait(5);

  console.log("ERC20Token Logic deployed");

  // await hre.run("verify:verify", {
  //   address: ERC20TokenLogic.address,
  //   constructorArguments: [],
  // });

  return ERC20TokenLogic.address;
};

const deployERC20TokenFactory = async (ERC20TokenLogicAddress: string) => {
  const ERC20TokenFactory = await ethers.getContractFactory(
    "ERC20TokenFactory"
  );
  const erc20TokenFactory = await ERC20TokenFactory.deploy(
    ERC20TokenLogicAddress
  );

  console.log("ERC20Token factory address: ", erc20TokenFactory.address);

  await erc20TokenFactory.deployTransaction.wait(5);

  console.log("ERC20Token factory deployed");

  // await hre.run("verify:verify", {
  //   address: erc20TokenFactory.address,
  //   constructorArguments: [ERC20TokenLogicAddress],
  // });
};

const main = async () => {
  const [owner] = await hre.ethers.getSigners();

  console.log("Deploying contracts with the account:", owner.address);
  console.log(
    `Owner [${owner.address}] Balance:`,
    ethers.utils.formatEther(await owner.getBalance()).toString()
  );

  const logicAddress = await deployERC20TokenLogic();

  await deployERC20TokenFactory(logicAddress);
};

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
