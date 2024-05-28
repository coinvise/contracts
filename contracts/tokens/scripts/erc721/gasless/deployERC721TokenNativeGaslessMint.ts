import hre, { ethers } from "hardhat";
import {
  ERC721TokenNativeGaslessMint,
  ERC721TokenNativeGaslessMint__factory,
} from "../../../typechain";
import { addContractToBiconomy, addMetaApiToBiconomy } from "../../utils";
import { mintERC721TokenNativeGaslessMintBiconomy } from "./mintERC721TokenNativeGaslessMint";
import { uploadMetadata } from "../../uploadMetadata";

const deployERC721TokenNativeGaslessMint = async (): Promise<string> => {
  const [owner, alice] = await hre.ethers.getSigners();

  const ERC721TokenNativeGaslessMint = <ERC721TokenNativeGaslessMint__factory>(
    await ethers.getContractFactory("ERC721TokenNativeGaslessMint")
  );

  const input = {
    name: "TestToken",
    symbol: "TEST",
    description: "Test description",
    externalLinkUrl: "https://coinvise.co",
    animationUrl: "",
    sellerFeeBasisPoints: 0,
    feeRecipient: owner.address,
    trustedAddress: owner.address,
    maxSupply: 10,
  };

  const { contractURI, tokenURI } = await uploadMetadata(input);

  const erc721TokenNativeGaslessMint: ERC721TokenNativeGaslessMint =
    await ERC721TokenNativeGaslessMint.deploy(
      input.name,
      input.symbol,
      contractURI,
      tokenURI,
      input.trustedAddress,
      input.maxSupply
    );
  console.log(
    "ERC721TokenNativeGaslessMint address: ",
    erc721TokenNativeGaslessMint.address
  );

  await erc721TokenNativeGaslessMint.deployTransaction.wait(5);

  console.log("ERC721TokenNativeGaslessMint deployed");

  /*  await hre.run("verify:verify", {
    address: ERC721TokenNativeGaslessMint.address,
    constructorArguments: [
      input.name,
      input.symbol,
      contractURI,
      tokenURI,
      input.trustedAddress,
      input.maxSupply,
    ],
  }); */

  // Add contract to Biconomy Dashboard
  await addContractToBiconomy(
    "ERC721TokenNativeGaslessMint",
    erc721TokenNativeGaslessMint.address,
    ERC721TokenNativeGaslessMint__factory.abi
  );
  console.log("Contract added to Biconomy");

  // Add executeMetaTransaction() API to Biconomy Dashboard
  await addMetaApiToBiconomy(erc721TokenNativeGaslessMint.address);
  console.log("Meta API added to Biconomy");

  // Mint via Biconomy relays
  console.log("Minting token with signature");
  await mintERC721TokenNativeGaslessMintBiconomy(
    erc721TokenNativeGaslessMint,
    owner,
    alice,
    alice.address
  );

  // Mint via OZ Relay
  /* console.log("Minting token with signature");
  await mintERC721TokenNativeGaslessMint(
    ERC721TokenNativeGaslessMint,
    owner,
    alice
  ); */

  return erc721TokenNativeGaslessMint.address;
};

const main = async () => {
  const [owner, alice] = await hre.ethers.getSigners();

  console.log("Deploying contracts with the account:", owner.address);
  console.log(
    `Owner [${owner.address}] Balance:`,
    ethers.utils.formatEther(await owner.getBalance()).toString()
  );
  console.log(
    `Alice [${alice.address}] Balance:`,
    ethers.utils.formatEther(await alice.getBalance()).toString()
  );

  await deployERC721TokenNativeGaslessMint();
};

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
