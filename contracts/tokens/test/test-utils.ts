import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Contract, ContractReceipt } from "ethers";
import { LogDescription, parseEther } from "ethers/lib/utils";
import hre, { ethers } from "hardhat";
import {
  ERC721SoulboundToken,
  ERC721SoulboundTokenImpl,
  ERC721Token,
  ERC721TokenImpl,
} from "../typechain";

export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
export const ZERO_ADDRESS_BYTES32 = ethers.constants.HashZero;

export const MINT_FEE = parseEther("0.0005"); // 0.0005 ETH
export const SPONSORED_MINT_FEE = parseEther("0.00035"); // 0.00035 ETH
export const MINT_FEE_RECIPIENT = "0x8df737904ab678B99717EF553b4eFdA6E3f94589"; // jenil.eth

export enum TokenType {
  ERC721Token,
  ERC721SoulboundToken,
  ERC721TokenNativeGaslessMint,
  ERC721SoulboundTokenNativeGaslessMint,
}

// TODO: make more type-safe
export const encodeInitializationData = (args: any[]) =>
  new ethers.utils.AbiCoder().encode(
    ["string", "string", "string", "string", "address", "address", "uint256"],
    args
  );
export const encodeInitializationDataWithSponsoredMints = (args: any[]) =>
  new ethers.utils.AbiCoder().encode(
    [
      "string",
      "string",
      "string",
      "string",
      "address",
      "address",
      "uint256",
      "uint256",
    ],
    args
  );

export const getEIP712TypedData = ({
  to,
  contractAddress,
  chainId,
  domainName,
  domainVersion,
}: {
  to: string;
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
    Mint: [{ name: "to", type: "address" }],
  };
  const value = {
    to,
  };

  return { domain, types, value };
};

/**
 * Generate and sign EIP712 typed data for ERC721Token contract
 * @param erc721 ERC721Token | ERC721SoulboundToken contract used
 * @param trustedAddress trustedAddress signer
 * @param to address to mint token to
 * @returns EIP712 signature from trustedAddress
 */
export const ERC721_generateSignature = async (
  erc721:
    | ERC721Token
    | ERC721SoulboundToken
    | ERC721TokenImpl
    | ERC721SoulboundTokenImpl,
  trustedAddress: SignerWithAddress,
  to: string
) => {
  const { domain, types, value } = getEIP712TypedData({
    to,
    contractAddress: erc721.address,
    chainId: hre.network.config.chainId as number,
    domainName: await erc721.name(),
    domainVersion: "1.0",
  });
  const rawSignature: string = await trustedAddress._signTypedData(
    domain,
    types,
    value
  );
  return ethers.utils.splitSignature(rawSignature);
};

export function getArgFromEvent(
  contract: Contract,
  receipt: ContractReceipt,
  eventName: string,
  argName: string
) {
  const parsedLogs = receipt.logs
    .map((log) => {
      try {
        return contract.interface.parseLog(log);
      } catch (error) {
        return null;
      }
    })
    .filter((val): val is LogDescription => Boolean(val));

  const event = parsedLogs.find(
    (log) =>
      log.eventFragment.name === contract.interface.getEvent(eventName).name
  );

  if (typeof event === "undefined" || event === null) {
    console.error(
      `Event ${eventName} not found in txn ${receipt.transactionHash}`
    );
    return;
  }

  if (
    typeof event.args[argName] === "undefined" ||
    event.args[argName] === null
  ) {
    console.error(`Arg ${argName} not found in txn ${receipt.transactionHash}`);
    return;
  }

  return event.args[argName];
}
