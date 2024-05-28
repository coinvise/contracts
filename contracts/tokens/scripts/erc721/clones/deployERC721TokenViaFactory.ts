require("dotenv").config();
import { Chain } from "@coinvise/chain";
import hre, { ethers } from "hardhat";
import config from "../../../config/config.json";
import {
  TokenType,
  encodeInitializationData,
  getArgFromEvent,
} from "../../../test/test-utils";
import { uploadMetadata } from "../../uploadMetadata";
import { mintERC721TokenWithMintingFee } from "../mintERC721Token";

const deployERC721TokenViaFactory = async (): Promise<string> => {
  let erc721TokenFactory;

  const network = await hre.ethers.provider.getNetwork();

  const [owner, trustedAddress, alice] = await hre.ethers.getSigners();

  if (network.chainId === Chain.supportedChains.mainnet) {
    // Ethereum Mainnet
    erc721TokenFactory = config.mainnet.ERC721TokenFactory.address;
  } else if (network.chainId === Chain.supportedChains.polygonMumbai) {
    // Mumbai Testnet
    erc721TokenFactory = config["polygon-mumbai"].ERC721TokenFactory.address;
  } else {
    erc721TokenFactory = process.env.ERC721_TOKEN_FACTORY || "";
  }

  const ERC721TokenFactory = await hre.ethers.getContractAt(
    "ERC721TokenFactory",
    erc721TokenFactory
  );

  /* Upload NFT metadata */

  const input = {
    name: "TestToken",
    symbol: "TEST",
    description: "Test description",
    externalLinkUrl: "https://coinvise.co",
    animationUrl: "",
    sellerFeeBasisPoints: 0,
    feeRecipient: owner.address,
    trustedAddress: trustedAddress.address,
    maxSupply: 10,
  };

  const { contractURI, tokenURI } = await uploadMetadata(input);

  /* Deploy token */

  // Edit following args before running script
  const deployERC721TokenViaFactory =
    await ERC721TokenFactory.deployERC721Token(
      TokenType.ERC721Token,
      encodeInitializationData([
        input.name,
        input.symbol,
        contractURI,
        tokenURI,
        owner.address,
        input.trustedAddress,
        input.maxSupply,
      ]),
      +new Date()
    );

  const receipt = await deployERC721TokenViaFactory.wait();
  const deployedERC721TokenCloneAddress = getArgFromEvent(
    ERC721TokenFactory,
    receipt,
    ERC721TokenFactory.interface.events[
      "ERC721TokenDeployed(uint8,address,address,address)"
    ].name,
    "_erc721TokenClone"
  );

  const erc721Token = await ethers.getContractAt(
    "ERC721TokenImpl",
    deployedERC721TokenCloneAddress
  );

  console.log("ERC721TokenImpl clone address: ", erc721Token.address);

  console.log("Minting token with signature");
  await mintERC721TokenWithMintingFee(
    erc721Token,
    trustedAddress,
    alice,
    alice.address
  );

  return erc721Token.address;
};

const deployERC721SoulboundTokenViaFactory = async (): Promise<string> => {
  let erc721TokenFactory;

  const network = await hre.ethers.provider.getNetwork();

  const [owner, trustedAddress, alice] = await hre.ethers.getSigners();

  if (network.chainId === Chain.supportedChains.mainnet) {
    // Ethereum Mainnet
    erc721TokenFactory = config.mainnet.ERC721TokenFactory.address;
  } else if (network.chainId === Chain.supportedChains.polygonMumbai) {
    // Mumbai Testnet
    erc721TokenFactory = config["polygon-mumbai"].ERC721TokenFactory.address;
  } else {
    erc721TokenFactory = process.env.ERC721_TOKEN_FACTORY || "";
  }

  const ERC721TokenFactory = await hre.ethers.getContractAt(
    "ERC721TokenFactory",
    erc721TokenFactory
  );

  /* Upload NFT metadata */

  const input = {
    name: "TestToken",
    symbol: "TEST",
    description: "Test description",
    externalLinkUrl: "https://coinvise.co",
    animationUrl: "",
    sellerFeeBasisPoints: 0,
    feeRecipient: owner.address,
    trustedAddress: trustedAddress.address,
    maxSupply: 10,
  };

  const { contractURI, tokenURI } = await uploadMetadata(input);

  // Edit following args before running script
  const deployERC721SoulboundTokenViaFactory =
    await ERC721TokenFactory.deployERC721Token(
      TokenType.ERC721SoulboundToken,
      encodeInitializationData([
        input.name,
        input.symbol,
        contractURI,
        tokenURI,
        owner.address,
        input.trustedAddress,
        input.maxSupply,
      ]),
      +new Date()
    );

  const receipt = await deployERC721SoulboundTokenViaFactory.wait();
  const deployedERC721SoulboundTokenCloneAddress = getArgFromEvent(
    ERC721TokenFactory,
    receipt,
    ERC721TokenFactory.interface.events[
      "ERC721TokenDeployed(uint8,address,address,address)"
    ].name,
    "_erc721TokenClone"
  );

  const erc721SoulboundToken = await ethers.getContractAt(
    "ERC721SoulboundTokenImpl",
    deployedERC721SoulboundTokenCloneAddress
  );

  console.log(
    "ERC721SoulboundTokenImpl clone address: ",
    erc721SoulboundToken.address
  );

  console.log("Minting token with signature");
  await mintERC721TokenWithMintingFee(
    erc721SoulboundToken,
    trustedAddress,
    alice,
    alice.address
  );

  return erc721SoulboundToken.address;
};

const main = async () => {
  const [owner] = await hre.ethers.getSigners();

  console.log("Deploying contracts with the account:", owner.address);
  console.log(
    `Owner [${owner.address}] Balance:`,
    ethers.utils.formatEther(await owner.getBalance()).toString()
  );

  await deployERC721TokenViaFactory();
  await deployERC721SoulboundTokenViaFactory();
};

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
