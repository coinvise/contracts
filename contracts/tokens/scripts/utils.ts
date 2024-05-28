// https://github.com/OpenZeppelin/workshops/blob/master/25-defender-metatx-api/src/signer.js

import { Chain } from "@coinvise/chain";
import axios from "axios";
import { BigNumber, Signature, ethers } from "ethers";
import https from "https";
import {
  ERC721SoulboundTokenImpl,
  ERC721SoulboundTokenNativeGaslessMint,
  ERC721TokenImpl,
  ERC721TokenNativeGaslessMint,
  MinimalForwarder,
} from "../typechain";

import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { getEnvVar } from "./uploadMetadata";

/**
 * ForwardRequest struct used in MinimalForwarder
 */
const ForwardRequest = [
  { name: "from", type: "address" },
  { name: "to", type: "address" },
  { name: "value", type: "uint256" },
  { name: "gas", type: "uint256" },
  { name: "nonce", type: "uint256" },
  { name: "data", type: "bytes" },
];

/**
 * Prepares types, domain data for signature to be submitted to MinimalForwarder
 * @param chainId
 * @param verifyingContract MinimalForwarder contract address that verifies EIP712 signature
 * @returns types, domain for preparing signature
 */
function getMetaTxTypeData(chainId: number, verifyingContract: string) {
  return {
    types: {
      ForwardRequest,
    },
    domain: {
      name: "MinimalForwarder",
      version: "0.0.1",
      chainId,
      verifyingContract,
    },
  };
}

/**
 * Prepares a ForwardRequest to be submitted to MinimalForwarder for execution
 * @param forwarder MinimalForwarder contract
 * @param input internal transaction to be executed in the meta txn
 * @returns ForwardRequest
 */
async function buildRequest(
  forwarder: MinimalForwarder,
  input: { from: string; to: string; data: string }
) {
  const nonce = await forwarder
    .getNonce(input.from)
    .then((nonce: BigNumber) => nonce.toString());
  return { value: 0, gas: 1e6, nonce, ...input };
}

/**
 * Combine types, domain, request for a ForwardRequest to be submitted to MinimalForwarder
 * @param forwarder MinimalForwarder contract
 * @param request internal transaction to be executed in the meta txn
 * @returns full data for signing a meta txn
 */
async function buildTypedData(
  forwarder: MinimalForwarder,
  request: {
    from: string;
    to: string;
    data: string;
    value: number;
    gas: number;
    nonce: string;
  }
) {
  const chainId = await forwarder.provider.getNetwork().then((n) => n.chainId);
  const typeData = getMetaTxTypeData(chainId, forwarder.address);
  return { ...typeData, message: request };
}

/**
 *
 * @param signer signer who should sign the meta txn request
 * @param forwarder MinimalForwarder contract
 * @param input internal transaction to be executed in the meta txn
 * @returns signed meta txn request, meta txn request
 */
export async function signMetaTxRequest(
  signer: SignerWithAddress,
  forwarder: MinimalForwarder,
  input: { from: string; to: string; data: string }
) {
  const request = await buildRequest(forwarder, input);
  const { domain, types, message } = await buildTypedData(forwarder, request);
  const signature = await signer._signTypedData(domain, types, message);
  return { signature, request };
}

/**
 * MetaTransaction struct used in Biconomy Native Meta txn standard
 */
const MetaTransaction = [
  { name: "nonce", type: "uint256" },
  { name: "from", type: "address" },
  { name: "functionSignature", type: "bytes" },
];

/**
 * Prepares types, domain, value data for signature to be submitted to Biconomy Native Meta txn impl
 * @returns full data for signing a meta txn
 */
export const getNativeMetaTxTypeData = ({
  nonce,
  userAddress,
  contractAddress,
  chainId,
  domainName,
  domainVersion,
  functionSignature,
}: {
  nonce: number | string | BigNumber;
  userAddress: string;
  contractAddress: string;
  chainId: number;
  domainName: string;
  domainVersion: string;
  functionSignature: string;
}) => {
  const domainData = {
    name: domainName,
    version: domainVersion,
    verifyingContract: contractAddress,
    salt: ethers.utils.hexZeroPad(
      ethers.BigNumber.from(chainId).toHexString(),
      32
    ),
  };

  const value = {
    nonce: parseInt(String(nonce)),
    from: userAddress,
    functionSignature,
  };

  return {
    domain: domainData,
    types: { MetaTransaction },
    value,
  };
};

/**
 * Awaits until Biconomy provider is ready for use
 * @param biconomy Biconomy provider
 */
export async function BiconomyReady(biconomy: any) {
  return new Promise<void>((resolve, reject) => {
    return biconomy
      .onEvent(biconomy.READY, async () => {
        resolve();
      })
      .onEvent(biconomy.ERROR, (error: any, message: any) => {
        reject(error);
      });
  });
}

const BICONOMY_KEY_MUMBAI = getEnvVar("BICONOMY_KEY_MUMBAI");
const BICONOMY_API_KEY = getEnvVar("BICONOMY_API_KEY");

/**
 * Add a contract to Biconomy Dashboard using Dashboard APIs
 * https://docs.biconomy.io/api/dashboard-apis#adding-a-smart-contract
 * @param contractName name of the contract to add
 * @param contractAddress address of the contract to add
 * @param abi abi of the contract to add
 */
export async function addContractToBiconomy(
  contractName: string,
  contractAddress: string,
  abi: any
) {
  const authToken = BICONOMY_API_KEY;
  const apiKey = BICONOMY_KEY_MUMBAI;
  const url =
    "https://api.biconomy.io/api/v1/smart-contract/public-api/addContract";

  const body = {
    contractName,
    contractAddress,
    abi: JSON.stringify(abi),
    contractType: "SC",
    metaTransactionType: "DEFAULT",
  };

  // Getting ECONNRESET Response from Biconomy API when keepAlive is not used with axios
  // Works fine when using default node-fetch tho
  const httpsAgent = new https.Agent({ keepAlive: true });

  const { data } = await axios.post(url, body, {
    httpsAgent,
    headers: {
      "Content-Type": "application/json",
      authToken,
      apiKey,
    },
  });
  console.log(data);
}
/**
 * Add `executeMetaTransaction()` method API to a contract to Biconomy Dashboard using Dashboard APIs
 * https://docs.biconomy.io/api/dashboard-apis#adding-a-meta-api
 * @param contractAddress address of the contract to add
 */
export async function addMetaApiToBiconomy(contractAddress: string) {
  const authToken = BICONOMY_API_KEY;
  const apiKey = BICONOMY_KEY_MUMBAI;
  const url = "https://api.biconomy.io/api/v1/meta-api/public-api/addMethod";

  const body = {
    apiType: "native",
    methodType: "write",
    name: "executeMetaTransaction",
    contractAddress,
    method: "executeMetaTransaction",
  };

  // Getting ECONNRESET Response from Biconomy API when keepAlive is not used with axios
  // Works fine when using default node-fetch tho
  const httpsAgent = new https.Agent({ keepAlive: true });

  const { data } = await axios.post(url, body, {
    httpsAgent,
    headers: {
      "Content-Type": "application/json",
      authToken,
      apiKey,
    },
  });
  console.log(data);
}

/**
 * Prepare native meta txn signature for minting a token from ERC721Token
 * @param erc721 ERC721Token contract to mint from
 * @param userAddress end-user signer who wants to mint
 * @param args to, r, s, v args to mint() method
 * @returns function calldata, signed meta txn signature's components
 */
export async function prepareNativeMetaTxnSignature(
  erc721: ERC721TokenNativeGaslessMint | ERC721SoulboundTokenNativeGaslessMint,
  userAddress: SignerWithAddress,
  args: { to: string; r: string; s: string; v: number }
): Promise<[string, Signature]> {
  const { to, r, s, v } = args;
  const nonce = await erc721.getNonce(userAddress.address);
  const chainId = await erc721.provider.getNetwork().then((n) => n.chainId);
  const domainName = await erc721.name();
  const functionSignature = erc721.interface.encodeFunctionData("mint", [
    to,
    r,
    s,
    v,
  ]);
  const { domain, types, value } = getNativeMetaTxTypeData({
    nonce,
    userAddress: userAddress.address,
    contractAddress: erc721.address,
    chainId,
    domainName,
    domainVersion: "1.0",
    functionSignature,
  });

  const signature = await userAddress._signTypedData(domain, types, value);
  return [functionSignature, ethers.utils.splitSignature(signature)];
}

// TODO: Refactor to avoid duplication
export async function prepareNativeMetaTxnSignatureWithReferrer(
  erc721: ERC721TokenImpl | ERC721SoulboundTokenImpl,
  userAddress: SignerWithAddress,
  args: { to: string; r: string; s: string; v: number; referrer: string }
): Promise<[string, Signature]> {
  const { to, r, s, v, referrer } = args;
  const nonce = await erc721.getNonce(userAddress.address);
  const chainId = await erc721.provider.getNetwork().then((n) => n.chainId);
  const domainName = await erc721.name();
  const functionSignature = erc721.interface.encodeFunctionData("mint", [
    to,
    r,
    s,
    v,
    referrer,
  ]);
  const { domain, types, value } = getNativeMetaTxTypeData({
    nonce,
    userAddress: userAddress.address,
    contractAddress: erc721.address,
    chainId,
    domainName,
    domainVersion: "1.0",
    functionSignature,
  });

  const signature = await userAddress._signTypedData(domain, types, value);
  return [functionSignature, ethers.utils.splitSignature(signature)];
}

export const getCampaignCreationFee = (networkId: number): BigNumber => {
  const chain = new Chain(networkId);
  if (
    chain.isEthereum() ||
    chain.isOptimism() ||
    chain.isBase() ||
    chain.isArbitrum() ||
    chain.isLinea() ||
    chain.isScroll() ||
    chain.isMorph() ||
    chain.isZircuit()
  ) {
    return ethers.utils.parseEther("0");
  } else if (chain.isPolygon()) {
    return ethers.utils.parseEther("0");
  } else if (chain.isNeonEVM()) {
    return ethers.utils.parseEther("0");
  } else {
    throw new Error("Invalid network");
  }
};

export const getCampaignMintFee = (networkId: number): BigNumber => {
  const chain = new Chain(networkId);
  if (
    chain.isEthereum() ||
    chain.isOptimism() ||
    chain.isBase() ||
    chain.isArbitrum() ||
    chain.isLinea() ||
    chain.isScroll() ||
    chain.isMorph() ||
    chain.isZircuit()
  ) {
    return ethers.utils.parseEther("0.0005");
  } else if (chain.isPolygon()) {
    return ethers.utils.parseEther("0.88");
  } else if (chain.isNeonEVM()) {
    return ethers.utils.parseEther("1");
  } else {
    throw new Error("Invalid network");
  }
};

export const getCampaignSponsoredMintFee = (networkId: number): BigNumber => {
  const chain = new Chain(networkId);
  if (
    chain.isEthereum() ||
    chain.isOptimism() ||
    chain.isBase() ||
    chain.isArbitrum() ||
    chain.isLinea() ||
    chain.isScroll() ||
    chain.isMorph() ||
    chain.isZircuit()
  ) {
    return ethers.utils.parseEther("0.00025");
  } else if (chain.isPolygon()) {
    return ethers.utils.parseEther("0.75");
  } else if (chain.isNeonEVM()) {
    return ethers.utils.parseEther("0.55");
  } else {
    throw new Error("Invalid network");
  }
};
