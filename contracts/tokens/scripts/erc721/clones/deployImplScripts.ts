import hre, { ethers } from "hardhat";
// import config from "../../../config/config.json";
import { MINT_FEE_RECIPIENT } from "../../../test/test-utils";
import { deployProtocolRewards } from "../../protocol-rewards/deployProtocolRewards";
import { getCampaignMintFee, getCampaignSponsoredMintFee } from "../../utils";
import { readFile } from "fs/promises";

export const getOrDeployProtocolRewards = async () => {
  const config = await readFile("./config/config.json", "utf8").then((d) =>
    JSON.parse(d)
  );
  const networkName = hre.network.name;
  console.log("🚀 networkName:", networkName);

  const ProtocolRewards =
    config[networkName].ProtocolRewards.address ||
    (await deployProtocolRewards());
  console.log("ProtocolRewards:", ProtocolRewards);

  return ProtocolRewards;
};

export const deployERC721TokenImplLogic = async (): Promise<string> => {
  const protocolRewards = await getOrDeployProtocolRewards();
  const ERC721TokenImpl = await ethers.getContractFactory("ERC721TokenImpl");
  const ERC721TokenImplLogic = await ERC721TokenImpl.deploy(
    getCampaignMintFee(hre.network.config.chainId!),
    getCampaignSponsoredMintFee(hre.network.config.chainId!),
    MINT_FEE_RECIPIENT,
    protocolRewards
  );
  console.log("ERC721TokenImpl logic address: ", ERC721TokenImplLogic.address);

  await ERC721TokenImplLogic.deployTransaction.wait(5);

  console.log("ERC721TokenImpl Logic deployed");

  await hre.run("verify:verify", {
    address: ERC721TokenImplLogic.address,
    constructorArguments: [
      getCampaignMintFee(hre.network.config.chainId!),
      getCampaignSponsoredMintFee(hre.network.config.chainId!),
      MINT_FEE_RECIPIENT,
      protocolRewards,
    ],
  });

  return ERC721TokenImplLogic.address;
};

export const deployERC721SoulboundTokenImplLogic =
  async (): Promise<string> => {
    const protocolRewards = await getOrDeployProtocolRewards();
    const ERC721SoulboundTokenImpl = await ethers.getContractFactory(
      "ERC721SoulboundTokenImpl"
    );
    const ERC721SoulboundTokenImplLogic = await ERC721SoulboundTokenImpl.deploy(
      getCampaignMintFee(hre.network.config.chainId!),
      getCampaignSponsoredMintFee(hre.network.config.chainId!),
      MINT_FEE_RECIPIENT,
      protocolRewards
    );
    console.log(
      "ERC721SoulboundTokenImpl logic address: ",
      ERC721SoulboundTokenImplLogic.address
    );

    await ERC721SoulboundTokenImplLogic.deployTransaction.wait(5);

    console.log("ERC721SoulboundTokenImpl Logic deployed");

    await hre.run("verify:verify", {
      address: ERC721SoulboundTokenImplLogic.address,
      constructorArguments: [
        getCampaignMintFee(hre.network.config.chainId!),
        getCampaignSponsoredMintFee(hre.network.config.chainId!),
        MINT_FEE_RECIPIENT,
        protocolRewards,
      ],
    });

    return ERC721SoulboundTokenImplLogic.address;
  };

export const deployERC721TokenNativeGaslessMintImplLogic =
  async (): Promise<string> => {
    const ERC721TokenNativeGaslessMintImpl = await ethers.getContractFactory(
      "ERC721TokenNativeGaslessMintImpl"
    );
    const ERC721TokenNativeGaslessMintImplLogic =
      await ERC721TokenNativeGaslessMintImpl.deploy();
    console.log(
      "ERC721TokenNativeGaslessMintImpl logic address: ",
      ERC721TokenNativeGaslessMintImplLogic.address
    );

    await ERC721TokenNativeGaslessMintImplLogic.deployTransaction.wait(5);

    console.log("ERC721TokenNativeGaslessMintImpl Logic deployed");

    await hre.run("verify:verify", {
      address: ERC721TokenNativeGaslessMintImplLogic.address,
      constructorArguments: [],
    });

    return ERC721TokenNativeGaslessMintImplLogic.address;
  };

export const deployERC721SoulboundTokenNativeGaslessMintImplLogic =
  async (): Promise<string> => {
    const ERC721SoulboundTokenNativeGaslessMintImpl =
      await ethers.getContractFactory(
        "ERC721SoulboundTokenNativeGaslessMintImpl"
      );
    const ERC721SoulboundTokenNativeGaslessMintImplLogic =
      await ERC721SoulboundTokenNativeGaslessMintImpl.deploy();
    console.log(
      "ERC721SoulboundTokenNativeGaslessMintImpl logic address: ",
      ERC721SoulboundTokenNativeGaslessMintImplLogic.address
    );

    await ERC721SoulboundTokenNativeGaslessMintImplLogic.deployTransaction.wait(
      5
    );

    console.log("ERC721SoulboundTokenNativeGaslessMintImpl Logic deployed");

    await hre.run("verify:verify", {
      address: ERC721SoulboundTokenNativeGaslessMintImplLogic.address,
      constructorArguments: [],
    });

    return ERC721SoulboundTokenNativeGaslessMintImplLogic.address;
  };
