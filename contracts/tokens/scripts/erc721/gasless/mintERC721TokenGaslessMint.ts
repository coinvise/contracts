import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {
  DefenderRelayProvider,
  DefenderRelaySigner,
} from "defender-relay-client/lib/ethers";
import hre, { ethers } from "hardhat";
import { ERC721_generateSignature } from "../../../test/test-utils";
import {
  ERC721TokenGaslessMint,
  ERC721TokenGaslessMint__factory,
  MinimalForwarder,
  MinimalForwarder__factory,
} from "../../../typechain";
import { getEnvVar } from "../../uploadMetadata";
import { signMetaTxRequest } from "../../utils";

const RELAYER_API_KEY = getEnvVar("RELAYER_API_KEY");
const RELAYER_API_SECRET = getEnvVar("RELAYER_API_SECRET");

/**
 * Mint ERC721TokenGaslessMint via OpenZeppelin Defender Relay using EIP 2771 Meta transactions
 * Prepares Relay signer from API Key, Secret
 * End user prepares and signs meta txn request for MinimalForwarder
 * Executes meta txn on MinimalForwarder using Relay signer
 * @param erc721 ERC721Token contract to mint from
 * @param admin admin signer for trustedAddress in ERC721Token
 * @param minter end-user signer who wants to mint
 */
export const mintERC721TokenGaslessMint = async (
  erc721: ERC721TokenGaslessMint,
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

  const credentials = {
    apiKey: RELAYER_API_KEY,
    apiSecret: RELAYER_API_SECRET,
  };
  const provider = new DefenderRelayProvider(credentials);
  const relaySigner = new DefenderRelaySigner(credentials, provider, {
    speed: "fast",
  });

  const txn = await erc721
    .connect(minter)
    .populateTransaction.mint(to, r, s, v);

  const forwarder: MinimalForwarder = MinimalForwarder__factory.connect(
    "0xdF5a433c75B0356f84b6Ee0d12Dec6C40be1a7c3",
    relaySigner
  );

  const { request, signature } = await signMetaTxRequest(minter, forwarder, {
    to: txn.to || "",
    from: txn.from || "",
    data: txn.data || "",
  });

  // Relay transaction!
  const tx = await relay(forwarder, request, signature);
  console.log(`Sent meta-tx: ${tx.hash}`);
  return { txHash: tx.hash };
};

/**
 * Verifies & executes meta transaction via MinimalForwarder contract connected to OZ Relay signer
 * @param forwarder MinimalForwarder contract connect with OZ Relay signer
 * @param request internal transaction to be executed in the meta txn
 * @param signature meta txn signature from end-user
 */
async function relay(
  forwarder: MinimalForwarder,
  request: {
    from: string;
    to: string;
    data: string;
    value: number;
    gas: number;
    nonce: string;
  },
  signature: string
) {
  // Validate request on the forwarder contract
  const valid = await forwarder.verify(request, signature);
  if (!valid) throw new Error(`Invalid request`);

  // Send meta-tx through relayer to the forwarder contract
  const gasLimit = (parseInt(request.gas.toString()) + 50000).toString();
  return await forwarder.execute(request, signature, { gasLimit });
}

const main = async () => {
  const [owner, alice, bob, charlie, eve] = await hre.ethers.getSigners();

  const erc721 = "0x52c840E0aB79D793f3f76ECb5E0Cae7372fcCe4A";

  const ERC721TokenGaslessMint: ERC721TokenGaslessMint =
    ERC721TokenGaslessMint__factory.connect(erc721, bob);

  console.log(
    `Owner [${owner.address}] Balance:`,
    ethers.utils.formatEther(await owner.getBalance()).toString()
  );
  console.log(
    `Minter [${bob.address}] Balance:`,
    ethers.utils.formatEther(await bob.getBalance()).toString()
  );

  await mintERC721TokenGaslessMint(
    ERC721TokenGaslessMint,
    owner,
    bob,
    bob.address
  );
};

/* main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  }); */
