import hre, { ethers } from "hardhat";
import { Vesting__factory } from "../typechain";

const main = async () => {
  const vestingInterface = Vesting__factory.createInterface();

  const fnData = vestingInterface.encodeFunctionData("initialize", [
    "0x3d02b87ae906f1d6f130832f67e5c10c9f869205",
    "0x53e3c485336569b7507f9afa63972308e5523844",
    "0x33d73cc0E060939476A10E47b86A4568c7DcF261",
    ethers.BigNumber.from(1636645564),
    ethers.BigNumber.from(2),
    ethers.BigNumber.from(10000).mul(ethers.BigNumber.from(10).pow(18)),
    ethers.BigNumber.from(6),
  ]);

  await hre.run("verify:verify", {
    address: "0xece289650eB24671D97dA98F9D9A841987611a35",
    constructorArguments: [
      "0xea852CB2Ef0f1A1c59629d77B87f58F05848B1Fb",
      fnData,
    ],
  });
};

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
