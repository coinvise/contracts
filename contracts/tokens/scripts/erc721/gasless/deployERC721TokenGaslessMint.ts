import hre, { ethers } from "hardhat";
import {
  ERC721TokenGaslessMint,
  ERC721TokenGaslessMint__factory,
} from "../../../typechain";
import { uploadMetadata } from "../../uploadMetadata";

const deployERC721TokenGaslessMint = async (): Promise<string> => {
  const [owner, alice] = await hre.ethers.getSigners();

  const ERC721TokenGaslessMint = <ERC721TokenGaslessMint__factory>(
    await ethers.getContractFactory("ERC721TokenGaslessMint")
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

  const erc721TokenGaslessMint: ERC721TokenGaslessMint =
    await ERC721TokenGaslessMint.deploy(
      input.name,
      input.symbol,
      contractURI,
      tokenURI,
      input.trustedAddress,
      input.maxSupply,
      "0xdF5a433c75B0356f84b6Ee0d12Dec6C40be1a7c3" // OpenZeppelin MinimalForwarder on Mumbai
    );
  console.log(
    "ERC721TokenGaslessMint address: ",
    erc721TokenGaslessMint.address
  );

  await erc721TokenGaslessMint.deployTransaction.wait(5);

  console.log("ERC721TokenGaslessMint deployed");

  /* await hre.run("verify:verify", {
    address: ERC721TokenGaslessMint.address,
    constructorArguments: [
      input.name,
      input.symbol,
      contractURI,
      tokenURI,
      input.trustedAddress,
      input.maxSupply,
      "0xdF5a433c75B0356f84b6Ee0d12Dec6C40be1a7c3",
    ],
  }); */

  // Mint via OZ Relay
  // console.log("Minting token with signature");
  // await mintERC721TokenGaslessMint(ERC721TokenGaslessMint, owner, alice);

  return erc721TokenGaslessMint.address;
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

  await deployERC721TokenGaslessMint();
};

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
