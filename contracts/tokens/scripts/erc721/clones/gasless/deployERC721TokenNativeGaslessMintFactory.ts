import hre, { ethers } from "hardhat";
import config from "../../../../config/config.json";
import {
  deployERC721SoulboundTokenImplLogic,
  deployERC721SoulboundTokenNativeGaslessMintImplLogic,
  deployERC721TokenImplLogic,
  deployERC721TokenNativeGaslessMintImplLogic,
} from "../deployImplScripts";

const deployERC721TokenNativeGaslessMintFactory = async (
  _erc721TokenImpl: string,
  _erc721SoulboundTokenImpl: string,
  _erc721TokenNativeGaslessMintImpl: string,
  _erc721SoulboundTokenNativeGaslessMintImpl: string
) => {
  const ERC721TokenNativeGaslessMintFactory = await ethers.getContractFactory(
    "ERC721TokenNativeGaslessMintFactory"
  );
  const erc721TokenFactory = await ERC721TokenNativeGaslessMintFactory.deploy(
    _erc721TokenImpl,
    _erc721SoulboundTokenImpl,
    _erc721TokenNativeGaslessMintImpl,
    _erc721SoulboundTokenNativeGaslessMintImpl
  );

  console.log(
    "ERC721TokenNativeGaslessMintFactory address: ",
    erc721TokenFactory.address
  );

  await erc721TokenFactory.deployTransaction.wait(5);

  console.log("ERC721TokenNativeGaslessMintFactory deployed");

  await hre.run("verify:verify", {
    address: erc721TokenFactory.address,
    constructorArguments: [
      _erc721TokenImpl,
      _erc721SoulboundTokenImpl,
      _erc721TokenNativeGaslessMintImpl,
      _erc721SoulboundTokenNativeGaslessMintImpl,
    ],
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

  console.log("ERC721TokenImpl:", ERC721TokenImplLogic);

  const ERC721SoulboundTokenImplLogic =
    config[networkName].ERC721SoulboundTokenImpl.address ||
    (await deployERC721SoulboundTokenImplLogic());
  console.log("ERC721SoulboundTokenImpl:", ERC721SoulboundTokenImplLogic);

  const ERC721TokenNativeGaslessMintImplLogic =
    config[networkName].ERC721TokenNativeGaslessMintImpl.address ||
    (await deployERC721TokenNativeGaslessMintImplLogic());
  console.log(
    "ERC721TokenNativeGaslessMintImpl:",
    ERC721TokenNativeGaslessMintImplLogic
  );

  const ERC721SoulboundTokenNativeGaslessMintImplLogic =
    config[networkName].ERC721SoulboundTokenNativeGaslessMintImpl.address ||
    (await deployERC721SoulboundTokenNativeGaslessMintImplLogic());
  console.log(
    "ERC721SoulboundTokenNativeGaslessMintImpl:",
    ERC721SoulboundTokenNativeGaslessMintImplLogic
  );

  if (config[networkName].ERC721TokenNativeGaslessMintFactory.address) {
    console.log(
      "ERC721TokenNativeGaslessMintFactory already deployed, checking if we need to update impl"
    );

    const factoryContract = await ethers.getContractAt(
      "ERC721TokenNativeGaslessMintFactory",
      config[networkName].ERC721TokenNativeGaslessMintFactory.address
    );

    if ((await factoryContract.erc721TokenImpl()) !== ERC721TokenImplLogic) {
      console.log("Updating ERC721TokenImpl");
      const tx = await factoryContract.setERC721TokenImplAddress(
        ERC721TokenImplLogic
      );
      await tx.wait(5);
    }

    if (
      (await factoryContract.erc721SoulboundTokenImpl()) !==
      ERC721SoulboundTokenImplLogic
    ) {
      console.log("Updating ERC721SoulboundTokenImpl");
      const tx = await factoryContract.setERC721SoulboundTokenImplAddress(
        ERC721SoulboundTokenImplLogic
      );
      await tx.wait(5);
    }

    if (
      (await factoryContract.erc721TokenNativeGaslessMintImpl()) !==
      ERC721TokenNativeGaslessMintImplLogic
    ) {
      console.log("Updating ERC721TokenNativeGaslessMintImpl");
      const tx =
        await factoryContract.setERC721TokenNativeGaslessMintImplAddress(
          ERC721TokenNativeGaslessMintImplLogic
        );
      await tx.wait(5);
    }

    if (
      (await factoryContract.erc721SoulboundTokenNativeGaslessMintImpl()) !==
      ERC721SoulboundTokenNativeGaslessMintImplLogic
    ) {
      console.log("Updating ERC721SoulboundTokenNativeGaslessMintImpl");
      const tx =
        await factoryContract.setERC721SoulboundTokenNativeGaslessMintImplAddress(
          ERC721SoulboundTokenNativeGaslessMintImplLogic
        );
      await tx.wait(5);
    }

    return;
  } else {
    await deployERC721TokenNativeGaslessMintFactory(
      ERC721TokenImplLogic,
      ERC721SoulboundTokenImplLogic,
      ERC721TokenNativeGaslessMintImplLogic,
      ERC721SoulboundTokenNativeGaslessMintImplLogic
    );
  }
};

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
