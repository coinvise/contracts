import { BigNumber, Signer } from "ethers";
import { ethers } from "hardhat";
import { CAMPAIGN_ID, CAMPAIGN_MANAGER } from "../../tasks/constants";

export const getTypedMessage = ({
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
  const metaTransactionType = [
    { name: "nonce", type: "uint256" },
    { name: "from", type: "address" },
    { name: "functionSignature", type: "bytes" },
  ];
  const domainType = [
    { name: "name", type: "string" },
    { name: "version", type: "string" },
    { name: "verifyingContract", type: "address" },
    { name: "salt", type: "bytes32" },
  ];
  const message = {
    nonce: parseInt(String(nonce)),
    from: userAddress,
    functionSignature,
  };
  const dataToSign = {
    types: {
      EIP712Domain: domainType,
      MetaTransaction: metaTransactionType,
    },
    domain: domainData,
    primaryType: "MetaTransaction",
    message,
  };
  return JSON.stringify(dataToSign);
};

export const getSignature = async (signer: Signer, claimerAddress: string) => {
  const hash = ethers.utils.keccak256(
    ethers.utils.defaultAbiCoder.encode(
      ["address", "uint256", "address"],
      [CAMPAIGN_MANAGER, CAMPAIGN_ID, claimerAddress],
    ),
  );
  const hashBytes = ethers.utils.arrayify(hash);
  const rawSignature = await signer.signMessage(hashBytes);

  const { v, r, s } = ethers.utils.splitSignature(rawSignature);
  return { v, r, s };
};
