import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import hre, { ethers } from "hardhat";
import { ERC721_generateSignature } from "../../test/test-utils";
import {
  ERC721SoulboundToken,
  ERC721SoulboundTokenImpl,
  ERC721Token,
  ERC721TokenImpl,
  ERC721TokenImpl__factory,
} from "../../typechain";
import { getCampaignMintFee } from "../utils";

export const mintERC721Token = async (
  erc721: ERC721Token | ERC721SoulboundToken,
  admin: SignerWithAddress,
  minter: SignerWithAddress,
  to: string
) => {
  const { v, r, s } = await ERC721_generateSignature(
    erc721,
    admin,
    minter.address
  );

  const txn = await erc721.connect(minter).mint(to, r, s, v);
  const receipt = await txn.wait();
  console.log("hash: ", receipt.transactionHash);
};

export const mintERC721TokenWithMintingFee = async (
  erc721: ERC721TokenImpl | ERC721SoulboundTokenImpl,
  admin: SignerWithAddress,
  minter: SignerWithAddress,
  to: string,
  referrer: string
) => {
  const { v, r, s } = await ERC721_generateSignature(erc721, admin, to);

  const maxSponsoredMints = await erc721.maxSponsoredMints();
  const isSponsoredMint = maxSponsoredMints.gt(0)
    ? (await erc721.sponsoredMints()).lt(maxSponsoredMints)
    : false;
  const txn = await erc721.connect(minter).mint(to, r, s, v, referrer, {
    value: isSponsoredMint
      ? 0
      : getCampaignMintFee(hre.network.config.chainId!),
    gasLimit: 15_000_000, // 15M fix for neon-evm devnet
  });
  const receipt = await txn.wait();
  console.log("hash: ", receipt.transactionHash);
};

const main = async () => {
  const [owner, trustedAddress, alice, bob] = await hre.ethers.getSigners();

  console.log("Deploying contracts with the account:", owner.address);
  console.log(
    `Owner [${owner.address}] Balance:`,
    ethers.utils.formatEther(await owner.getBalance()).toString()
  );

  const address = "0x0A4734f230c063713cdB32Ef5F44f6BcCE460B55";
  const erc721 = ERC721TokenImpl__factory.connect(address, owner);

  await mintERC721TokenWithMintingFee(
    erc721,
    trustedAddress,
    alice,
    ethers.Wallet.createRandom().address,
    bob.address
  );
};

/* main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  }); */
