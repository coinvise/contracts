import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { BigNumber, Signature, Wallet, ethers } from "ethers";
import { Campaigns, CampaignsNativeGaslessClaim } from "../src/types/contracts/campaigns";

export const getEIP712TypedData = ({
  campaignManager,
  campaignId,
  claimer,
  contractAddress,
  chainId,
  domainName,
  domainVersion,
}: {
  campaignManager: string;
  campaignId: number;
  claimer: string;
  contractAddress: string;
  chainId: number;
  domainName: string;
  domainVersion: string;
}) => {
  const domain = {
    name: domainName,
    version: domainVersion,
    chainId,
    verifyingContract: contractAddress,
  };
  const types = {
    Claim: [
      { name: "campaignManager", type: "address" },
      { name: "campaignId", type: "uint256" },
      { name: "claimer", type: "address" },
    ],
  };
  const value = {
    campaignManager,
    campaignId,
    claimer,
  };

  return { domain, types, value };
};

/**
 * Generate and sign EIP712 typed data for claiming from Campaigns contract
 * @param campaigns Campaigns contract used
 * @param trustedAddress trustedAddress signer
 * @param to address to mint token to
 * @returns EIP712 signature from trustedAddress
 */
export const Campaigns_generateClaimSignature = async (
  campaigns: Campaigns | CampaignsNativeGaslessClaim,
  domainName: "Campaigns" | "CampaignsNativeGaslessClaim",
  campaignManager: string,
  campaignId: number,
  claimer: string,
  trustedAddress: SignerWithAddress | Wallet,
) => {
  const { domain, types, value } = getEIP712TypedData({
    campaignManager,
    campaignId,
    claimer,
    contractAddress: campaigns.address,
    chainId: (await campaigns.provider.getNetwork()).chainId as number,
    domainName,
    domainVersion: "1.0",
  });

  const rawSignature: string = await trustedAddress._signTypedData(domain, types, value);
  return ethers.utils.splitSignature(rawSignature);
};

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
    salt: ethers.utils.hexZeroPad(ethers.BigNumber.from(chainId).toHexString(), 32),
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
 * Prepare native meta txn signature for claiming a campaign from CampaignsNativeGaslessClaim
 * @param campaignsNativeGaslessClaim CampaignsNativeGaslessClaim contract to claim from
 * @param claimer end-user signer who wants to claimer
 * @param args r, s, v args to claim() method
 * @returns function calldata, signed meta txn signature's components
 */
export async function prepareNativeMetaTxnSignature(
  campaignsNativeGaslessClaim: CampaignsNativeGaslessClaim,
  claimer: SignerWithAddress,
  args: { campaignManager: string; campaignId: number; r: string; s: string; v: number; referrer: string },
): Promise<[string, Signature]> {
  const { campaignManager, campaignId, r, s, v, referrer } = args;
  const nonce = await campaignsNativeGaslessClaim.getNonce(claimer.address);
  const chainId = await campaignsNativeGaslessClaim.provider.getNetwork().then(n => n.chainId);
  const functionSignature = campaignsNativeGaslessClaim.interface.encodeFunctionData("claim", [
    campaignManager,
    campaignId,
    r,
    s,
    v,
    referrer,
  ]);
  const { domain, types, value } = getNativeMetaTxTypeData({
    nonce,
    userAddress: claimer.address,
    contractAddress: campaignsNativeGaslessClaim.address,
    chainId,
    domainName: "CampaignsNativeGaslessClaim",
    domainVersion: "1.0",
    functionSignature,
  });

  const signature = await claimer._signTypedData(domain, types, value);
  return [functionSignature, ethers.utils.splitSignature(signature)];
}
