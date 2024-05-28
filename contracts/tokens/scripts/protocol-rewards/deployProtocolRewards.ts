import hre, { ethers } from "hardhat";
import { readFile, writeFile } from "fs/promises";

export const deployProtocolRewards = async () => {
  const ProtocolRewards = await ethers.getContractFactory("ProtocolRewards");
  const protocolRewards = await ProtocolRewards.deploy();

  console.log("ProtocolRewards address: ", protocolRewards.address);

  await protocolRewards.deployTransaction.wait(5);

  console.log("ProtocolRewards deployed");
  try {
    await hre.run("verify:verify", {
      address: protocolRewards.address,
      constructorArguments: [],
    });
  } catch (error) {
    console.log("🚀 ~ deployProtocolRewards ~ error:", error);
  }

  const config = await readFile("./config/config.json", "utf8").then((d) =>
    JSON.parse(d)
  );

  config[hre.network.name]["ProtocolRewards"].address = protocolRewards.address;
  await writeFile("./config/config.json", JSON.stringify(config, null, 2));

  return protocolRewards.address;
};

const main = async () => {
  const [owner] = await hre.ethers.getSigners();

  console.log("Deploying contracts with the account:", owner.address);
  console.log(
    `Owner [${owner.address}] Balance:`,
    ethers.utils.formatEther(await owner.getBalance()).toString()
  );

  await deployProtocolRewards();
};

// main()
//   .then(() => process.exit(0))
//   .catch((e) => {
//     console.error(e);
//     process.exit(1);
//   });
