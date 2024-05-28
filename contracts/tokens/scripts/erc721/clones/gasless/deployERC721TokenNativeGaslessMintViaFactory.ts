require("dotenv").config();
import hre, { ethers } from "hardhat";
import config from "../../../../config/config.json";
import {
  TokenType,
  encodeInitializationData,
  encodeInitializationDataWithSponsoredMints,
  getArgFromEvent,
} from "../../../../test/test-utils";
import {
  ERC721SoulboundTokenNativeGaslessMintImpl__factory,
  ERC721TokenNativeGaslessMintImpl__factory,
} from "../../../../typechain";
import { uploadMetadata } from "../../../uploadMetadata";
import {
  addContractToBiconomy,
  addMetaApiToBiconomy,
  getCampaignSponsoredMintFee,
} from "../../../utils";
import { mintERC721SoulboundTokenNativeGaslessMintBiconomy } from "../../gasless/mintERC721SoulboundTokenNativeGaslessMint";
import { mintERC721TokenNativeGaslessMintBiconomy } from "../../gasless/mintERC721TokenNativeGaslessMint";
import {
  mintERC721Token,
  mintERC721TokenWithMintingFee,
} from "../../mintERC721Token";

const networkName = hre.network.name as keyof typeof config;
const erc721TokenNativeGaslessMintFactory =
  config[networkName].ERC721TokenNativeGaslessMintFactory.address ||
  process.env.ERC721_TOKEN_FACTORY ||
  "";
console.log(
  "ERC721TokenNativeGaslessMintFactory:",
  erc721TokenNativeGaslessMintFactory
);

const contractURI =
  "ipfs://bafkreibn7oivtgtcr3qlmmukozgxcfmiyje6uscj3hp3njrz4be6uxpemq";
const tokenURI =
  "ipfs://bafkreigx7p4o7gkwaet3nofx7a2tzdkzqh4zhra33qtyl4kuadun343z54";

const deployERC721TokenViaFactory = async (): Promise<string> => {
  const [owner, trustedAddress, alice, bob] = await hre.ethers.getSigners();

  const ERC721TokenNativeGaslessMintFactory = await hre.ethers.getContractAt(
    "ERC721TokenNativeGaslessMintFactory",
    erc721TokenNativeGaslessMintFactory
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
    maxSponsoredMints: 5,
  };
  // const { contractURI, tokenURI } = await uploadMetadata(input);

  /* Deploy token */

  // Edit following args before running script
  const deployERC721TokenViaFactory =
    await ERC721TokenNativeGaslessMintFactory.deployERC721Token(
      TokenType.ERC721Token,
      encodeInitializationDataWithSponsoredMints([
        input.name,
        input.symbol,
        contractURI,
        tokenURI,
        owner.address,
        input.trustedAddress,
        input.maxSupply,
        input.maxSponsoredMints,
      ]),
      +new Date(),
      {
        value: getCampaignSponsoredMintFee(hre.network.config.chainId!).mul(
          input.maxSponsoredMints
        ),
      }
    );

  const receipt = await deployERC721TokenViaFactory.wait();
  const deployedERC721TokenCloneAddress = getArgFromEvent(
    ERC721TokenNativeGaslessMintFactory,
    receipt,
    ERC721TokenNativeGaslessMintFactory.interface.events[
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
    alice.address,
    bob.address
  );

  return erc721Token.address;
};

const deployERC721SoulboundTokenViaFactory = async (): Promise<string> => {
  const [owner, trustedAddress, alice, bob] = await hre.ethers.getSigners();

  const ERC721TokenNativeGaslessMintFactory = await hre.ethers.getContractAt(
    "ERC721TokenNativeGaslessMintFactory",
    erc721TokenNativeGaslessMintFactory
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
    maxSponsoredMints: 5,
  };
  // const { contractURI, tokenURI } = await uploadMetadata(input);

  // Edit following args before running script
  const deployERC721SoulboundTokenViaFactory =
    await ERC721TokenNativeGaslessMintFactory.deployERC721Token(
      TokenType.ERC721SoulboundToken,
      encodeInitializationDataWithSponsoredMints([
        input.name,
        input.symbol,
        contractURI,
        tokenURI,
        owner.address,
        input.trustedAddress,
        input.maxSupply,
        input.maxSponsoredMints,
      ]),
      +new Date(),
      {
        value: getCampaignSponsoredMintFee(hre.network.config.chainId!).mul(
          input.maxSponsoredMints
        ),
      }
    );

  const receipt = await deployERC721SoulboundTokenViaFactory.wait();
  const deployedERC721SoulboundTokenCloneAddress = getArgFromEvent(
    ERC721TokenNativeGaslessMintFactory,
    receipt,
    ERC721TokenNativeGaslessMintFactory.interface.events[
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
    alice.address,
    bob.address
  );

  return erc721SoulboundToken.address;
};

const deployERC721TokenNativeGaslessMintViaFactory =
  async (): Promise<string> => {
    const [owner, trustedAddress, alice, bob] = await hre.ethers.getSigners();

    const ERC721TokenNativeGaslessMintFactory = await hre.ethers.getContractAt(
      "ERC721TokenNativeGaslessMintFactory",
      erc721TokenNativeGaslessMintFactory
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
    // const { contractURI, tokenURI } = await uploadMetadata(input);

    /* Deploy token */

    // Edit following args before running script
    const deployERC721TokenViaFactory =
      await ERC721TokenNativeGaslessMintFactory.deployERC721Token(
        TokenType.ERC721TokenNativeGaslessMint,
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
      ERC721TokenNativeGaslessMintFactory,
      receipt,
      ERC721TokenNativeGaslessMintFactory.interface.events[
        "ERC721TokenDeployed(uint8,address,address,address)"
      ].name,
      "_erc721TokenClone"
    );

    const erc721Token = await ethers.getContractAt(
      "ERC721TokenNativeGaslessMintImpl",
      deployedERC721TokenCloneAddress
    );

    console.log(
      "ERC721TokenNativeGaslessMintImpl clone address: ",
      erc721Token.address
    );

    /* // Add contract to Biconomy Dashboard
    await addContractToBiconomy(
      "ERC721TokenNativeGaslessMintImpl",
      erc721Token.address,
      ERC721TokenNativeGaslessMintImpl__factory.abi
    );
    console.log("Contract added to Biconomy");

    // Add executeMetaTransaction() API to Biconomy Dashboard
    await addMetaApiToBiconomy(erc721Token.address);
    console.log("Meta API added to Biconomy"); */

    // Normal mint
    console.log("Minting token with signature");
    await mintERC721Token(erc721Token, trustedAddress, alice, alice.address);

    // Mint via Biconomy relays
    console.log("Minting token with signature via metaTxn");
    await mintERC721TokenNativeGaslessMintBiconomy(
      erc721Token,
      trustedAddress,
      bob,
      bob.address
    );

    return erc721Token.address;
  };

const deployERC721SoulboundTokenNativeGaslessMintViaFactory =
  async (): Promise<string> => {
    const [owner, trustedAddress, alice, bob] = await hre.ethers.getSigners();

    const ERC721TokenNativeGaslessMintFactory = await hre.ethers.getContractAt(
      "ERC721TokenNativeGaslessMintFactory",
      erc721TokenNativeGaslessMintFactory
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
    // const { contractURI, tokenURI } = await uploadMetadata(input);

    /* Deploy token */

    // Edit following args before running script
    const deployERC721TokenViaFactory =
      await ERC721TokenNativeGaslessMintFactory.deployERC721Token(
        TokenType.ERC721SoulboundTokenNativeGaslessMint,
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
      ERC721TokenNativeGaslessMintFactory,
      receipt,
      ERC721TokenNativeGaslessMintFactory.interface.events[
        "ERC721TokenDeployed(uint8,address,address,address)"
      ].name,
      "_erc721TokenClone"
    );

    const erc721Token = await ethers.getContractAt(
      "ERC721SoulboundTokenNativeGaslessMintImpl",
      deployedERC721TokenCloneAddress
    );

    console.log(
      "ERC721SoulboundTokenNativeGaslessMintImpl clone address: ",
      erc721Token.address
    );

    /* // Add contract to Biconomy Dashboard
    await addContractToBiconomy(
      "ERC721SoulboundTokenNativeGaslessMintImpl",
      erc721Token.address,
      ERC721SoulboundTokenNativeGaslessMintImpl__factory.abi
    );
    console.log("Contract added to Biconomy");

    // Add executeMetaTransaction() API to Biconomy Dashboard
    await addMetaApiToBiconomy(erc721Token.address);
    console.log("Meta API added to Biconomy"); */

    // Normal mint
    console.log("Minting token with signature");
    await mintERC721Token(erc721Token, trustedAddress, alice, alice.address);

    // Mint via Biconomy relays
    console.log("Minting token with signature via metaTxn");
    await mintERC721SoulboundTokenNativeGaslessMintBiconomy(
      erc721Token,
      trustedAddress,
      bob,
      bob.address
    );

    return erc721Token.address;
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
  await deployERC721TokenNativeGaslessMintViaFactory();
  await deployERC721SoulboundTokenNativeGaslessMintViaFactory();
};

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
