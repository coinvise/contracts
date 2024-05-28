import hre, { ethers } from "hardhat";

const deployXCollective = async (): Promise<string> => {
  const xCollectiveFactory = await ethers.getContractFactory("xCollective");
  const xCollective = await xCollectiveFactory.deploy();
  console.log("xCollective address: ", xCollective.address);

  await xCollective.deployTransaction.wait(5);

  console.log("xCollective Logic deployed");

  // await hre.run("verify:verify", {
  //   address: xCollective.address,
  //   constructorArguments: [],
  // });

  return xCollective.address;
};

const main = async () => {
  const [owner] = await hre.ethers.getSigners();

  console.log("Deploying contracts with the account:", owner.address);
  console.log(
    `Owner [${owner.address}] Balance:`,
    ethers.utils.formatEther(await owner.getBalance()).toString()
  );

  await deployXCollective();
};

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
