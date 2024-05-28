import hre, { ethers } from "hardhat";
import config from "../../../config/config.json";
import {
  deployERC721SoulboundTokenImplLogic,
  deployERC721TokenImplLogic,
} from "./deployImplScripts";

const deployERC721TokenFactory = async (
  _erc721TokenImpl: string,
  _erc721SoulboundTokenImpl: string
) => {
  const ERC721TokenFactory = await ethers.getContractFactory(
    "ERC721TokenFactory"
  );
  const erc721TokenFactory = await ERC721TokenFactory.deploy(
    _erc721TokenImpl,
    _erc721SoulboundTokenImpl
  );

  console.log("ERC721TokenFactory address: ", erc721TokenFactory.address);

  await erc721TokenFactory.deployTransaction.wait(5);

  console.log("ERC721TokenFactory deployed");

  await hre.run("verify:verify", {
    address: erc721TokenFactory.address,
    constructorArguments: [_erc721TokenImpl, _erc721SoulboundTokenImpl],
  });
};

const main = async () => {
  const [owner] = await hre.ethers.getSigners();

  console.log("Deploying contracts with the account:", owner.address);
  console.log(
    `Owner [${owner.address}] Balance:`,
    ethers.utils.formatEther(await owner.getBalance()).toString()
  );

  const networkName = hre.network.name as keyof typeof config;
  console.log(
    "🚀 ~ file: deployERC721TokenNativeGaslessMintFactory.ts:144 ~ main ~ networkName:",
    networkName
  );

  const ERC721TokenImplLogic =
    config[networkName].ERC721TokenImpl.address ||
    (await deployERC721TokenImplLogic());

  console.log("ERC721TokenImplLogic:", ERC721TokenImplLogic);

  const ERC721SoulboundTokenImplLogic =
    config[networkName].ERC721SoulboundTokenImpl.address ||
    (await deployERC721SoulboundTokenImplLogic());
  console.log("ERC721SoulboundTokenImplLogic:", ERC721SoulboundTokenImplLogic);

  await deployERC721TokenFactory(
    ERC721TokenImplLogic,
    ERC721SoulboundTokenImplLogic
  );
};

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
