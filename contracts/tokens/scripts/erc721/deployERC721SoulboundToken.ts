import hre, { ethers } from "hardhat";
import {
  ERC721SoulboundToken,
  ERC721SoulboundToken__factory,
} from "../../typechain";
import { uploadMetadata } from "../uploadMetadata";
import { mintERC721Token } from "./mintERC721Token";

const deployERC721SoulboundToken = async (): Promise<string> => {
  const [owner, alice] = await hre.ethers.getSigners();

  const ERC721SoulboundToken = <ERC721SoulboundToken__factory>(
    await ethers.getContractFactory("ERC721SoulboundToken")
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

  const erc721SoulboundToken: ERC721SoulboundToken =
    await ERC721SoulboundToken.deploy(
      input.name,
      input.symbol,
      contractURI,
      tokenURI,
      input.trustedAddress,
      input.maxSupply
    );
  console.log("ERC721SoulboundToken address: ", erc721SoulboundToken.address);

  await erc721SoulboundToken.deployTransaction.wait(5);

  console.log("ERC721SoulboundToken deployed");

  /* await hre.run("verify:verify", {
    address: ERC721SoulboundToken.address,
    constructorArguments: [
      "TestToken",
      "TEST",
      "https://example.com/contractURI",
      "https://example.com",
      owner.address,
      10,
    ],
  }); */

  console.log("Minting token with signature");
  await mintERC721Token(erc721SoulboundToken, owner, alice, alice.address);

  return erc721SoulboundToken.address;
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

  await deployERC721SoulboundToken();
};

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
