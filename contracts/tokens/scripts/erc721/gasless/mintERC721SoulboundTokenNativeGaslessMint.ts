import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {
  DefenderRelayProvider,
  DefenderRelaySigner,
} from "defender-relay-client/lib/ethers";
import hre, { ethers } from "hardhat";
import { ERC721_generateSignature } from "../../../test/test-utils";
import {
  ERC721SoulboundTokenNativeGaslessMint,
  ERC721SoulboundTokenNativeGaslessMint__factory,
} from "../../../typechain";
import { getEnvVar } from "../../uploadMetadata";
import { prepareNativeMetaTxnSignature } from "../../utils";

const RELAYER_API_KEY = getEnvVar("RELAYER_API_KEY");
const RELAYER_API_SECRET = getEnvVar("RELAYER_API_SECRET");

/**
 * Mint ERC721SoulboundTokenNativeGaslessMint via OpenZeppelin Defender Relay using Biconomy's Native Meta transaction standard
 * Prepares Relay signer from API Key, Secret
 * End user prepares and signs meta txn request for native meta txn
 * Executes meta txn on token contract using Relay signer
 * @param erc721 ERC721Token contract to mint from
 * @param admin admin signer for trustedAddress in ERC721Token
 * @param minter end-user signer who wants to mint
 */
export const mintERC721SoulboundTokenNativeGaslessMint = async (
  erc721: ERC721SoulboundTokenNativeGaslessMint,
  admin: SignerWithAddress,
  minter: SignerWithAddress,
  to: string
) => {
  const { v, r, s } = await ERC721_generateSignature(
    erc721,
    admin,
    minter.address
  );

  // console.log("~ r", r);
  // console.log("~ s", s);
  // console.log("~ v", v);

  const [functionSignature, { r: metaTxnR, s: metaTxnS, v: metaTxnV }] =
    await prepareNativeMetaTxnSignature(erc721, minter, { to, r, s, v });
  const credentials = {
    apiKey: RELAYER_API_KEY,
    apiSecret: RELAYER_API_SECRET,
  };
  const provider = new DefenderRelayProvider(credentials);
  const relaySigner = new DefenderRelaySigner(credentials, provider, {
    speed: "fast",
  });

  const metaTxn = await erc721
    .connect(relaySigner)
    .executeMetaTransaction(
      minter.address,
      functionSignature,
      metaTxnR,
      metaTxnS,
      metaTxnV
    );
  const receipt = await metaTxn.wait();
  console.log("hash: ", receipt.transactionHash);
};

const BICONOMY_KEY_MUMBAI = getEnvVar("BICONOMY_KEY_MUMBAI");

/**
 * Mint ERC721SoulboundTokenNativeGaslessMint via Biconomy relays using Biconomy's Native Meta transaction standard
 * Prepares Biconomy provider from API Key
 * End user prepares and signs meta txn request for native meta txn
 * Executes meta txn on token contract using Biconomy provider
 * Prerequisite: contract & executeMetaTransaction() api added in Biconomy dashboard
 * @param erc721 ERC721Token contract to mint from
 * @param admin admin signer for trustedAddress in ERC721Token
 * @param minter end-user signer who wants to mint
 */
export const mintERC721SoulboundTokenNativeGaslessMintBiconomy = async (
  erc721: ERC721SoulboundTokenNativeGaslessMint,
  admin: SignerWithAddress,
  minter: SignerWithAddress,
  to: string
) => {
  const { v, r, s } = await ERC721_generateSignature(
    erc721,
    admin,
    minter.address
  );

  // console.log("~ r", r);
  // console.log("~ s", s);
  // console.log("~ v", v);

  const [functionSignature, { r: metaTxnR, s: metaTxnS, v: metaTxnV }] =
    await prepareNativeMetaTxnSignature(erc721, minter, { to, r, s, v });

  /* const biconomy = new Biconomy(minter.provider, {
    apiKey: BICONOMY_KEY_MUMBAI,
  });

  await BiconomyReady(biconomy);
  console.log("Biconomy initialized");

  const contractWithBiconomy = erc721.connect(
    biconomy.getSignerByAddress(minter.address)
  ); */

  const metaTxn = await erc721.executeMetaTransaction(
    minter.address,
    functionSignature,
    metaTxnR,
    metaTxnS,
    metaTxnV,
    // { gasLimit: 200_000 }
    { gasLimit: 15_000_000 } // 15M fix for neon-evm devnet
  );
  const receipt = await metaTxn.wait();
  console.log("hash: ", receipt.transactionHash);
};

const main = async () => {
  const [owner, alice, bob, charlie, eve] = await hre.ethers.getSigners();

  const erc721 = "0x0A9c61E3d4e2B31D79f3450f84AB94f8138f0c4f";

  const ERC721SoulboundTokenNativeGaslessMint: ERC721SoulboundTokenNativeGaslessMint =
    ERC721SoulboundTokenNativeGaslessMint__factory.connect(erc721, charlie);

  console.log(
    `Owner [${owner.address}] Balance:`,
    ethers.utils.formatEther(await owner.getBalance()).toString()
  );
  console.log(
    `Minter [${charlie.address}] Balance:`,
    ethers.utils.formatEther(await charlie.getBalance()).toString()
  );

  await mintERC721SoulboundTokenNativeGaslessMintBiconomy(
    ERC721SoulboundTokenNativeGaslessMint,
    owner,
    charlie,
    charlie.address
  );
};

/* main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  }); */
