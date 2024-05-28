import hre, { ethers } from "hardhat";

const deployMultisend = async (): Promise<string> => {
  const Multisend = await ethers.getContractFactory("Multisend");
  const multisend = await Multisend.deploy();
  console.log("Multisend address: ", multisend.address);

  await multisend.deployTransaction.wait(5);

  console.log("Multisend deployed");

  try {
    await hre.run("verify:verify", {
      address: multisend.address,
      constructorArguments: [],
    });
  } catch (error) {
    console.error(error);
    console.log(
      `Failed to verify, run:\nnpx hardhat verify --network ${hre.network.name} ${multisend.address}`
    );
  }

  return multisend.address;
};

const main = async () => {
  const [owner] = await hre.ethers.getSigners();

  console.log("Deploying contracts with the account:", owner.address);
  console.log(
    `Owner [${owner.address}] Balance:`,
    ethers.utils.formatEther(await owner.getBalance()).toString()
  );

  await deployMultisend();
};

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
