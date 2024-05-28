import hre, { ethers } from "hardhat";
import {
  ERC721SoulboundTokenNativeGaslessMint,
  ERC721SoulboundTokenNativeGaslessMint__factory,
} from "../../../typechain";
import { uploadMetadata } from "../../uploadMetadata";
import { mintERC721SoulboundTokenNativeGaslessMint } from "./mintERC721SoulboundTokenNativeGaslessMint";

const deployERC721SoulboundTokenNativeGaslessMint =
  async (): Promise<string> => {
    const [owner, alice] = await hre.ethers.getSigners();

    const ERC721SoulboundTokenNativeGaslessMint = <
      ERC721SoulboundTokenNativeGaslessMint__factory
    >await ethers.getContractFactory("ERC721SoulboundTokenNativeGaslessMint");

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

    const erc721SoulboundTokenNativeGaslessMint: ERC721SoulboundTokenNativeGaslessMint =
      await ERC721SoulboundTokenNativeGaslessMint.deploy(
        input.name,
        input.symbol,
        contractURI,
        tokenURI,
        input.trustedAddress,
        input.maxSupply
      );
    console.log(
      "ERC721SoulboundTokenNativeGaslessMint address: ",
      erc721SoulboundTokenNativeGaslessMint.address
    );

    await erc721SoulboundTokenNativeGaslessMint.deployTransaction.wait(5);

    console.log("ERC721SoulboundTokenNativeGaslessMint deployed");

    /*  await hre.run("verify:verify", {
    address: ERC721SoulboundTokenNativeGaslessMint.address,
    constructorArguments: [
      input.name,
      input.symbol,
      contractURI,
      tokenURI,
      input.trustedAddress,
      input.maxSupply,
    ],
  }); */

    /*  // Add contract to Biconomy Dashboard
    await addContractToBiconomy(
      "ERC721SoulboundTokenNativeGaslessMint",
      ERC721SoulboundTokenNativeGaslessMint.address,
      ERC721SoulboundTokenNativeGaslessMint__factory.abi
    );
    console.log("Contract added to Biconomy");

    // Add executeMetaTransaction() API to Biconomy Dashboard
    await addMetaApiToBiconomy(ERC721SoulboundTokenNativeGaslessMint.address);
    console.log("Meta API added to Biconomy");

    // Mint via Biconomy relays
    console.log("Minting token with signature");
    await mintERC721SoulboundTokenNativeGaslessMintBiconomy(
      ERC721SoulboundTokenNativeGaslessMint,
      owner,
      alice
    ); */

    // Mint via OZ Relay
    console.log("Minting token with signature");
    await mintERC721SoulboundTokenNativeGaslessMint(
      erc721SoulboundTokenNativeGaslessMint,
      owner,
      alice,
      alice.address
    );

    return erc721SoulboundTokenNativeGaslessMint.address;
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

  await deployERC721SoulboundTokenNativeGaslessMint();
};

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
