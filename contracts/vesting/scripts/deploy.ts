import hre, { ethers } from "hardhat";

const deployVestingLogic = async (): Promise<string> => {
  const Vesting = await ethers.getContractFactory("Vesting");
  const vestingLogic = await Vesting.deploy();
  console.log("Vesting logic address: ", vestingLogic.address);

  await vestingLogic.deployTransaction.wait(5);

  console.log("Vesting Logic deployed");

  try {
    await hre.run("verify:verify", {
      address: vestingLogic.address,
      constructorArguments: [],
    });
  } catch (error) {
    console.error(error);
    console.log(
      `Failed to verify, run:\nnpx hardhat verify --network ${hre.network.name} ${vestingLogic.address}`
    );
  }

  return vestingLogic.address;
};

const deployVestingFactory = async (vestingLogicAddress: string) => {
  const VestingFactory = await ethers.getContractFactory("VestingFactory");
  const vestingFactory = await VestingFactory.deploy(vestingLogicAddress);

  console.log("Vesting factory address: ", vestingFactory.address);

  await vestingFactory.deployTransaction.wait(5);

  console.log("Vesting Logic deployed");

  try {
    await hre.run("verify:verify", {
      address: vestingFactory.address,
      constructorArguments: [vestingLogicAddress],
    });
  } catch (error) {
    console.error(error);
    console.log(
      `Failed to verify, run:\nnpx hardhat verify --network ${hre.network.name} ${vestingFactory.address} "${vestingLogicAddress}"`
    );
  }
};

const main = async () => {
  const [owner] = await hre.ethers.getSigners();

  console.log("Deploying contracts with the account:", owner.address);
  console.log(
    `Owner [${owner.address}] Balance:`,
    ethers.utils.formatEther(await owner.getBalance()).toString()
  );

  const logicAddress = await deployVestingLogic();

  await deployVestingFactory(logicAddress);
};

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
