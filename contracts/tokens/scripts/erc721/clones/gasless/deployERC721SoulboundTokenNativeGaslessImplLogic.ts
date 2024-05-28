import hre, { ethers } from "hardhat";
import config from "../../../../config/config.json";
import { deployERC721SoulboundTokenNativeGaslessMintImplLogic } from "../deployImplScripts";

const main = async () => {
  const [owner] = await hre.ethers.getSigners();

  console.log("Deploying contracts with the account:", owner.address);
  console.log(
    `Owner [${owner.address}] Balance:`,
    ethers.utils.formatEther(await owner.getBalance()).toString()
  );

  const networkName = hre.network.name as keyof typeof config;
  console.log("networkName:", networkName);

  await deployERC721SoulboundTokenNativeGaslessMintImplLogic();
};

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
