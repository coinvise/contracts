/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import {
  ethers,
  EventFilter,
  Signer,
  BigNumber,
  BigNumberish,
  PopulatedTransaction,
  BaseContract,
  ContractTransaction,
  Overrides,
  PayableOverrides,
  CallOverrides,
} from "ethers";
import { BytesLike } from "@ethersproject/bytes";
import { Listener, Provider } from "@ethersproject/providers";
import { FunctionFragment, EventFragment, Result } from "@ethersproject/abi";
import type { TypedEventFilter, TypedEvent, TypedListener, OnEvent } from "./common";

export type MembershipStruct = {
  tokenAddress: string;
  price: BigNumberish;
  validity: BigNumberish;
  cap: BigNumberish;
  airdropToken: string;
  airdropAmount: BigNumberish;
};

export type MembershipStructOutput = [string, BigNumber, BigNumber, BigNumber, string, BigNumber] & {
  tokenAddress: string;
  price: BigNumber;
  validity: BigNumber;
  cap: BigNumber;
  airdropToken: string;
  airdropAmount: BigNumber;
};

export interface MembershipsInterface extends ethers.utils.Interface {
  functions: {
    "airdropAmount()": FunctionFragment;
    "airdropToken()": FunctionFragment;
    "approve(address,uint256)": FunctionFragment;
    "balanceOf(address)": FunctionFragment;
    "cap()": FunctionFragment;
    "changeBaseTokenURI()": FunctionFragment;
    "contractURI()": FunctionFragment;
    "expirationTimestampOf(uint256)": FunctionFragment;
    "factory()": FunctionFragment;
    "getApproved(uint256)": FunctionFragment;
    "hasValidToken(address)": FunctionFragment;
    "initialize(address,address,string,string,string,string,(address,uint256,uint256,uint256,address,uint256))": FunctionFragment;
    "isApprovedForAll(address,address)": FunctionFragment;
    "isValid(uint256)": FunctionFragment;
    "mint(address)": FunctionFragment;
    "name()": FunctionFragment;
    "owner()": FunctionFragment;
    "ownerOf(uint256)": FunctionFragment;
    "pause()": FunctionFragment;
    "paused()": FunctionFragment;
    "price()": FunctionFragment;
    "purchase(address)": FunctionFragment;
    "renew(uint256)": FunctionFragment;
    "renounceOwnership()": FunctionFragment;
    "royaltyInfo(uint256,uint256)": FunctionFragment;
    "safeTransferFrom(address,address,uint256)": FunctionFragment;
    "setApprovalForAll(address,bool)": FunctionFragment;
    "setDefaultRoyalty(address,uint96)": FunctionFragment;
    "supportsInterface(bytes4)": FunctionFragment;
    "symbol()": FunctionFragment;
    "tokenAddress()": FunctionFragment;
    "tokenByIndex(uint256)": FunctionFragment;
    "tokenOfOwnerByIndex(address,uint256)": FunctionFragment;
    "tokenURI(uint256)": FunctionFragment;
    "totalSupply()": FunctionFragment;
    "transferFrom(address,address,uint256)": FunctionFragment;
    "transferOwnership(address)": FunctionFragment;
    "treasury()": FunctionFragment;
    "unpause()": FunctionFragment;
    "validity()": FunctionFragment;
    "version()": FunctionFragment;
    "withdraw()": FunctionFragment;
  };

  encodeFunctionData(functionFragment: "airdropAmount", values?: undefined): string;
  encodeFunctionData(functionFragment: "airdropToken", values?: undefined): string;
  encodeFunctionData(functionFragment: "approve", values: [string, BigNumberish]): string;
  encodeFunctionData(functionFragment: "balanceOf", values: [string]): string;
  encodeFunctionData(functionFragment: "cap", values?: undefined): string;
  encodeFunctionData(functionFragment: "changeBaseTokenURI", values?: undefined): string;
  encodeFunctionData(functionFragment: "contractURI", values?: undefined): string;
  encodeFunctionData(functionFragment: "expirationTimestampOf", values: [BigNumberish]): string;
  encodeFunctionData(functionFragment: "factory", values?: undefined): string;
  encodeFunctionData(functionFragment: "getApproved", values: [BigNumberish]): string;
  encodeFunctionData(functionFragment: "hasValidToken", values: [string]): string;
  encodeFunctionData(
    functionFragment: "initialize",
    values: [string, string, string, string, string, string, MembershipStruct],
  ): string;
  encodeFunctionData(functionFragment: "isApprovedForAll", values: [string, string]): string;
  encodeFunctionData(functionFragment: "isValid", values: [BigNumberish]): string;
  encodeFunctionData(functionFragment: "mint", values: [string]): string;
  encodeFunctionData(functionFragment: "name", values?: undefined): string;
  encodeFunctionData(functionFragment: "owner", values?: undefined): string;
  encodeFunctionData(functionFragment: "ownerOf", values: [BigNumberish]): string;
  encodeFunctionData(functionFragment: "pause", values?: undefined): string;
  encodeFunctionData(functionFragment: "paused", values?: undefined): string;
  encodeFunctionData(functionFragment: "price", values?: undefined): string;
  encodeFunctionData(functionFragment: "purchase", values: [string]): string;
  encodeFunctionData(functionFragment: "renew", values: [BigNumberish]): string;
  encodeFunctionData(functionFragment: "renounceOwnership", values?: undefined): string;
  encodeFunctionData(functionFragment: "royaltyInfo", values: [BigNumberish, BigNumberish]): string;
  encodeFunctionData(functionFragment: "safeTransferFrom", values: [string, string, BigNumberish]): string;
  encodeFunctionData(functionFragment: "setApprovalForAll", values: [string, boolean]): string;
  encodeFunctionData(functionFragment: "setDefaultRoyalty", values: [string, BigNumberish]): string;
  encodeFunctionData(functionFragment: "supportsInterface", values: [BytesLike]): string;
  encodeFunctionData(functionFragment: "symbol", values?: undefined): string;
  encodeFunctionData(functionFragment: "tokenAddress", values?: undefined): string;
  encodeFunctionData(functionFragment: "tokenByIndex", values: [BigNumberish]): string;
  encodeFunctionData(functionFragment: "tokenOfOwnerByIndex", values: [string, BigNumberish]): string;
  encodeFunctionData(functionFragment: "tokenURI", values: [BigNumberish]): string;
  encodeFunctionData(functionFragment: "totalSupply", values?: undefined): string;
  encodeFunctionData(functionFragment: "transferFrom", values: [string, string, BigNumberish]): string;
  encodeFunctionData(functionFragment: "transferOwnership", values: [string]): string;
  encodeFunctionData(functionFragment: "treasury", values?: undefined): string;
  encodeFunctionData(functionFragment: "unpause", values?: undefined): string;
  encodeFunctionData(functionFragment: "validity", values?: undefined): string;
  encodeFunctionData(functionFragment: "version", values?: undefined): string;
  encodeFunctionData(functionFragment: "withdraw", values?: undefined): string;

  decodeFunctionResult(functionFragment: "airdropAmount", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "airdropToken", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "approve", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "balanceOf", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "cap", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "changeBaseTokenURI", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "contractURI", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "expirationTimestampOf", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "factory", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "getApproved", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "hasValidToken", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "initialize", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "isApprovedForAll", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "isValid", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "mint", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "name", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "owner", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "ownerOf", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "pause", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "paused", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "price", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "purchase", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "renew", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "renounceOwnership", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "royaltyInfo", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "safeTransferFrom", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "setApprovalForAll", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "setDefaultRoyalty", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "supportsInterface", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "symbol", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "tokenAddress", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "tokenByIndex", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "tokenOfOwnerByIndex", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "tokenURI", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "totalSupply", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "transferFrom", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "transferOwnership", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "treasury", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "unpause", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "validity", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "version", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "withdraw", data: BytesLike): Result;

  events: {
    "Approval(address,address,uint256)": EventFragment;
    "ApprovalForAll(address,address,bool)": EventFragment;
    "Initialized(uint8)": EventFragment;
    "MembershipMinted(uint256,address,uint256)": EventFragment;
    "MembershipPurchased(uint256,address,uint256)": EventFragment;
    "MembershipRenewed(uint256,uint256)": EventFragment;
    "OwnershipTransferred(address,address)": EventFragment;
    "Paused(address)": EventFragment;
    "Transfer(address,address,uint256)": EventFragment;
    "Unpaused(address)": EventFragment;
    "Withdrawal(uint256,address,uint256,address)": EventFragment;
  };

  getEvent(nameOrSignatureOrTopic: "Approval"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "ApprovalForAll"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "Initialized"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "MembershipMinted"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "MembershipPurchased"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "MembershipRenewed"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "OwnershipTransferred"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "Paused"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "Transfer"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "Unpaused"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "Withdrawal"): EventFragment;
}

export type ApprovalEvent = TypedEvent<
  [string, string, BigNumber],
  { owner: string; approved: string; tokenId: BigNumber }
>;

export type ApprovalEventFilter = TypedEventFilter<ApprovalEvent>;

export type ApprovalForAllEvent = TypedEvent<
  [string, string, boolean],
  { owner: string; operator: string; approved: boolean }
>;

export type ApprovalForAllEventFilter = TypedEventFilter<ApprovalForAllEvent>;

export type InitializedEvent = TypedEvent<[number], { version: number }>;

export type InitializedEventFilter = TypedEventFilter<InitializedEvent>;

export type MembershipMintedEvent = TypedEvent<
  [BigNumber, string, BigNumber],
  { tokenId: BigNumber; recipient: string; expirationTimestamp: BigNumber }
>;

export type MembershipMintedEventFilter = TypedEventFilter<MembershipMintedEvent>;

export type MembershipPurchasedEvent = TypedEvent<
  [BigNumber, string, BigNumber],
  { tokenId: BigNumber; recipient: string; expirationTimestamp: BigNumber }
>;

export type MembershipPurchasedEventFilter = TypedEventFilter<MembershipPurchasedEvent>;

export type MembershipRenewedEvent = TypedEvent<
  [BigNumber, BigNumber],
  { tokenId: BigNumber; newExpirationTimestamp: BigNumber }
>;

export type MembershipRenewedEventFilter = TypedEventFilter<MembershipRenewedEvent>;

export type OwnershipTransferredEvent = TypedEvent<[string, string], { previousOwner: string; newOwner: string }>;

export type OwnershipTransferredEventFilter = TypedEventFilter<OwnershipTransferredEvent>;

export type PausedEvent = TypedEvent<[string], { account: string }>;

export type PausedEventFilter = TypedEventFilter<PausedEvent>;

export type TransferEvent = TypedEvent<[string, string, BigNumber], { from: string; to: string; tokenId: BigNumber }>;

export type TransferEventFilter = TypedEventFilter<TransferEvent>;

export type UnpausedEvent = TypedEvent<[string], { account: string }>;

export type UnpausedEventFilter = TypedEventFilter<UnpausedEvent>;

export type WithdrawalEvent = TypedEvent<
  [BigNumber, string, BigNumber, string],
  { amount: BigNumber; treasury: string; fee: BigNumber; feeTreasury: string }
>;

export type WithdrawalEventFilter = TypedEventFilter<WithdrawalEvent>;

export interface Memberships extends BaseContract {
  connect(signerOrProvider: Signer | Provider | string): this;
  attach(addressOrName: string): this;
  deployed(): Promise<this>;

  interface: MembershipsInterface;

  queryFilter<TEvent extends TypedEvent>(
    event: TypedEventFilter<TEvent>,
    fromBlockOrBlockhash?: string | number | undefined,
    toBlock?: string | number | undefined,
  ): Promise<Array<TEvent>>;

  listeners<TEvent extends TypedEvent>(eventFilter?: TypedEventFilter<TEvent>): Array<TypedListener<TEvent>>;
  listeners(eventName?: string): Array<Listener>;
  removeAllListeners<TEvent extends TypedEvent>(eventFilter: TypedEventFilter<TEvent>): this;
  removeAllListeners(eventName?: string): this;
  off: OnEvent<this>;
  on: OnEvent<this>;
  once: OnEvent<this>;
  removeListener: OnEvent<this>;

  functions: {
    airdropAmount(overrides?: CallOverrides): Promise<[BigNumber]>;

    airdropToken(overrides?: CallOverrides): Promise<[string]>;

    approve(
      to: string,
      tokenId: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> },
    ): Promise<ContractTransaction>;

    balanceOf(owner: string, overrides?: CallOverrides): Promise<[BigNumber]>;

    cap(overrides?: CallOverrides): Promise<[BigNumber]>;

    changeBaseTokenURI(overrides?: Overrides & { from?: string | Promise<string> }): Promise<ContractTransaction>;

    contractURI(overrides?: CallOverrides): Promise<[string]>;

    expirationTimestampOf(tokenId: BigNumberish, overrides?: CallOverrides): Promise<[BigNumber]>;

    factory(overrides?: CallOverrides): Promise<[string]>;

    getApproved(tokenId: BigNumberish, overrides?: CallOverrides): Promise<[string]>;

    hasValidToken(_owner: string, overrides?: CallOverrides): Promise<[boolean]>;

    initialize(
      _owner: string,
      _treasury: string,
      _name: string,
      _symbol: string,
      contractURI_: string,
      baseURI_: string,
      _membership: MembershipStruct,
      overrides?: Overrides & { from?: string | Promise<string> },
    ): Promise<ContractTransaction>;

    isApprovedForAll(owner: string, operator: string, overrides?: CallOverrides): Promise<[boolean]>;

    isValid(tokenId: BigNumberish, overrides?: CallOverrides): Promise<[boolean]>;

    mint(recipient: string, overrides?: Overrides & { from?: string | Promise<string> }): Promise<ContractTransaction>;

    name(overrides?: CallOverrides): Promise<[string]>;

    owner(overrides?: CallOverrides): Promise<[string]>;

    ownerOf(tokenId: BigNumberish, overrides?: CallOverrides): Promise<[string]>;

    pause(overrides?: Overrides & { from?: string | Promise<string> }): Promise<ContractTransaction>;

    paused(overrides?: CallOverrides): Promise<[boolean]>;

    price(overrides?: CallOverrides): Promise<[BigNumber]>;

    purchase(
      recipient: string,
      overrides?: PayableOverrides & { from?: string | Promise<string> },
    ): Promise<ContractTransaction>;

    renew(
      tokenId: BigNumberish,
      overrides?: PayableOverrides & { from?: string | Promise<string> },
    ): Promise<ContractTransaction>;

    renounceOwnership(overrides?: Overrides & { from?: string | Promise<string> }): Promise<ContractTransaction>;

    royaltyInfo(
      _tokenId: BigNumberish,
      _salePrice: BigNumberish,
      overrides?: CallOverrides,
    ): Promise<[string, BigNumber]>;

    "safeTransferFrom(address,address,uint256)"(
      from: string,
      to: string,
      tokenId: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> },
    ): Promise<ContractTransaction>;

    "safeTransferFrom(address,address,uint256,bytes)"(
      from: string,
      to: string,
      tokenId: BigNumberish,
      data: BytesLike,
      overrides?: Overrides & { from?: string | Promise<string> },
    ): Promise<ContractTransaction>;

    setApprovalForAll(
      operator: string,
      approved: boolean,
      overrides?: Overrides & { from?: string | Promise<string> },
    ): Promise<ContractTransaction>;

    setDefaultRoyalty(
      _receiver: string,
      _feeNumerator: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> },
    ): Promise<ContractTransaction>;

    supportsInterface(interfaceId: BytesLike, overrides?: CallOverrides): Promise<[boolean]>;

    symbol(overrides?: CallOverrides): Promise<[string]>;

    tokenAddress(overrides?: CallOverrides): Promise<[string]>;

    tokenByIndex(index: BigNumberish, overrides?: CallOverrides): Promise<[BigNumber]>;

    tokenOfOwnerByIndex(owner: string, index: BigNumberish, overrides?: CallOverrides): Promise<[BigNumber]>;

    tokenURI(tokenId: BigNumberish, overrides?: CallOverrides): Promise<[string]>;

    totalSupply(overrides?: CallOverrides): Promise<[BigNumber]>;

    transferFrom(
      from: string,
      to: string,
      tokenId: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> },
    ): Promise<ContractTransaction>;

    transferOwnership(
      newOwner: string,
      overrides?: Overrides & { from?: string | Promise<string> },
    ): Promise<ContractTransaction>;

    treasury(overrides?: CallOverrides): Promise<[string]>;

    unpause(overrides?: Overrides & { from?: string | Promise<string> }): Promise<ContractTransaction>;

    validity(overrides?: CallOverrides): Promise<[BigNumber]>;

    version(overrides?: CallOverrides): Promise<[number]>;

    withdraw(overrides?: Overrides & { from?: string | Promise<string> }): Promise<ContractTransaction>;
  };

  airdropAmount(overrides?: CallOverrides): Promise<BigNumber>;

  airdropToken(overrides?: CallOverrides): Promise<string>;

  approve(
    to: string,
    tokenId: BigNumberish,
    overrides?: Overrides & { from?: string | Promise<string> },
  ): Promise<ContractTransaction>;

  balanceOf(owner: string, overrides?: CallOverrides): Promise<BigNumber>;

  cap(overrides?: CallOverrides): Promise<BigNumber>;

  changeBaseTokenURI(overrides?: Overrides & { from?: string | Promise<string> }): Promise<ContractTransaction>;

  contractURI(overrides?: CallOverrides): Promise<string>;

  expirationTimestampOf(tokenId: BigNumberish, overrides?: CallOverrides): Promise<BigNumber>;

  factory(overrides?: CallOverrides): Promise<string>;

  getApproved(tokenId: BigNumberish, overrides?: CallOverrides): Promise<string>;

  hasValidToken(_owner: string, overrides?: CallOverrides): Promise<boolean>;

  initialize(
    _owner: string,
    _treasury: string,
    _name: string,
    _symbol: string,
    contractURI_: string,
    baseURI_: string,
    _membership: MembershipStruct,
    overrides?: Overrides & { from?: string | Promise<string> },
  ): Promise<ContractTransaction>;

  isApprovedForAll(owner: string, operator: string, overrides?: CallOverrides): Promise<boolean>;

  isValid(tokenId: BigNumberish, overrides?: CallOverrides): Promise<boolean>;

  mint(recipient: string, overrides?: Overrides & { from?: string | Promise<string> }): Promise<ContractTransaction>;

  name(overrides?: CallOverrides): Promise<string>;

  owner(overrides?: CallOverrides): Promise<string>;

  ownerOf(tokenId: BigNumberish, overrides?: CallOverrides): Promise<string>;

  pause(overrides?: Overrides & { from?: string | Promise<string> }): Promise<ContractTransaction>;

  paused(overrides?: CallOverrides): Promise<boolean>;

  price(overrides?: CallOverrides): Promise<BigNumber>;

  purchase(
    recipient: string,
    overrides?: PayableOverrides & { from?: string | Promise<string> },
  ): Promise<ContractTransaction>;

  renew(
    tokenId: BigNumberish,
    overrides?: PayableOverrides & { from?: string | Promise<string> },
  ): Promise<ContractTransaction>;

  renounceOwnership(overrides?: Overrides & { from?: string | Promise<string> }): Promise<ContractTransaction>;

  royaltyInfo(
    _tokenId: BigNumberish,
    _salePrice: BigNumberish,
    overrides?: CallOverrides,
  ): Promise<[string, BigNumber]>;

  "safeTransferFrom(address,address,uint256)"(
    from: string,
    to: string,
    tokenId: BigNumberish,
    overrides?: Overrides & { from?: string | Promise<string> },
  ): Promise<ContractTransaction>;

  "safeTransferFrom(address,address,uint256,bytes)"(
    from: string,
    to: string,
    tokenId: BigNumberish,
    data: BytesLike,
    overrides?: Overrides & { from?: string | Promise<string> },
  ): Promise<ContractTransaction>;

  setApprovalForAll(
    operator: string,
    approved: boolean,
    overrides?: Overrides & { from?: string | Promise<string> },
  ): Promise<ContractTransaction>;

  setDefaultRoyalty(
    _receiver: string,
    _feeNumerator: BigNumberish,
    overrides?: Overrides & { from?: string | Promise<string> },
  ): Promise<ContractTransaction>;

  supportsInterface(interfaceId: BytesLike, overrides?: CallOverrides): Promise<boolean>;

  symbol(overrides?: CallOverrides): Promise<string>;

  tokenAddress(overrides?: CallOverrides): Promise<string>;

  tokenByIndex(index: BigNumberish, overrides?: CallOverrides): Promise<BigNumber>;

  tokenOfOwnerByIndex(owner: string, index: BigNumberish, overrides?: CallOverrides): Promise<BigNumber>;

  tokenURI(tokenId: BigNumberish, overrides?: CallOverrides): Promise<string>;

  totalSupply(overrides?: CallOverrides): Promise<BigNumber>;

  transferFrom(
    from: string,
    to: string,
    tokenId: BigNumberish,
    overrides?: Overrides & { from?: string | Promise<string> },
  ): Promise<ContractTransaction>;

  transferOwnership(
    newOwner: string,
    overrides?: Overrides & { from?: string | Promise<string> },
  ): Promise<ContractTransaction>;

  treasury(overrides?: CallOverrides): Promise<string>;

  unpause(overrides?: Overrides & { from?: string | Promise<string> }): Promise<ContractTransaction>;

  validity(overrides?: CallOverrides): Promise<BigNumber>;

  version(overrides?: CallOverrides): Promise<number>;

  withdraw(overrides?: Overrides & { from?: string | Promise<string> }): Promise<ContractTransaction>;

  callStatic: {
    airdropAmount(overrides?: CallOverrides): Promise<BigNumber>;

    airdropToken(overrides?: CallOverrides): Promise<string>;

    approve(to: string, tokenId: BigNumberish, overrides?: CallOverrides): Promise<void>;

    balanceOf(owner: string, overrides?: CallOverrides): Promise<BigNumber>;

    cap(overrides?: CallOverrides): Promise<BigNumber>;

    changeBaseTokenURI(overrides?: CallOverrides): Promise<void>;

    contractURI(overrides?: CallOverrides): Promise<string>;

    expirationTimestampOf(tokenId: BigNumberish, overrides?: CallOverrides): Promise<BigNumber>;

    factory(overrides?: CallOverrides): Promise<string>;

    getApproved(tokenId: BigNumberish, overrides?: CallOverrides): Promise<string>;

    hasValidToken(_owner: string, overrides?: CallOverrides): Promise<boolean>;

    initialize(
      _owner: string,
      _treasury: string,
      _name: string,
      _symbol: string,
      contractURI_: string,
      baseURI_: string,
      _membership: MembershipStruct,
      overrides?: CallOverrides,
    ): Promise<void>;

    isApprovedForAll(owner: string, operator: string, overrides?: CallOverrides): Promise<boolean>;

    isValid(tokenId: BigNumberish, overrides?: CallOverrides): Promise<boolean>;

    mint(recipient: string, overrides?: CallOverrides): Promise<[BigNumber, BigNumber]>;

    name(overrides?: CallOverrides): Promise<string>;

    owner(overrides?: CallOverrides): Promise<string>;

    ownerOf(tokenId: BigNumberish, overrides?: CallOverrides): Promise<string>;

    pause(overrides?: CallOverrides): Promise<void>;

    paused(overrides?: CallOverrides): Promise<boolean>;

    price(overrides?: CallOverrides): Promise<BigNumber>;

    purchase(recipient: string, overrides?: CallOverrides): Promise<[BigNumber, BigNumber]>;

    renew(tokenId: BigNumberish, overrides?: CallOverrides): Promise<BigNumber>;

    renounceOwnership(overrides?: CallOverrides): Promise<void>;

    royaltyInfo(
      _tokenId: BigNumberish,
      _salePrice: BigNumberish,
      overrides?: CallOverrides,
    ): Promise<[string, BigNumber]>;

    "safeTransferFrom(address,address,uint256)"(
      from: string,
      to: string,
      tokenId: BigNumberish,
      overrides?: CallOverrides,
    ): Promise<void>;

    "safeTransferFrom(address,address,uint256,bytes)"(
      from: string,
      to: string,
      tokenId: BigNumberish,
      data: BytesLike,
      overrides?: CallOverrides,
    ): Promise<void>;

    setApprovalForAll(operator: string, approved: boolean, overrides?: CallOverrides): Promise<void>;

    setDefaultRoyalty(_receiver: string, _feeNumerator: BigNumberish, overrides?: CallOverrides): Promise<void>;

    supportsInterface(interfaceId: BytesLike, overrides?: CallOverrides): Promise<boolean>;

    symbol(overrides?: CallOverrides): Promise<string>;

    tokenAddress(overrides?: CallOverrides): Promise<string>;

    tokenByIndex(index: BigNumberish, overrides?: CallOverrides): Promise<BigNumber>;

    tokenOfOwnerByIndex(owner: string, index: BigNumberish, overrides?: CallOverrides): Promise<BigNumber>;

    tokenURI(tokenId: BigNumberish, overrides?: CallOverrides): Promise<string>;

    totalSupply(overrides?: CallOverrides): Promise<BigNumber>;

    transferFrom(from: string, to: string, tokenId: BigNumberish, overrides?: CallOverrides): Promise<void>;

    transferOwnership(newOwner: string, overrides?: CallOverrides): Promise<void>;

    treasury(overrides?: CallOverrides): Promise<string>;

    unpause(overrides?: CallOverrides): Promise<void>;

    validity(overrides?: CallOverrides): Promise<BigNumber>;

    version(overrides?: CallOverrides): Promise<number>;

    withdraw(overrides?: CallOverrides): Promise<void>;
  };

  filters: {
    "Approval(address,address,uint256)"(
      owner?: string | null,
      approved?: string | null,
      tokenId?: BigNumberish | null,
    ): ApprovalEventFilter;
    Approval(owner?: string | null, approved?: string | null, tokenId?: BigNumberish | null): ApprovalEventFilter;

    "ApprovalForAll(address,address,bool)"(
      owner?: string | null,
      operator?: string | null,
      approved?: null,
    ): ApprovalForAllEventFilter;
    ApprovalForAll(owner?: string | null, operator?: string | null, approved?: null): ApprovalForAllEventFilter;

    "Initialized(uint8)"(version?: null): InitializedEventFilter;
    Initialized(version?: null): InitializedEventFilter;

    "MembershipMinted(uint256,address,uint256)"(
      tokenId?: BigNumberish | null,
      recipient?: string | null,
      expirationTimestamp?: null,
    ): MembershipMintedEventFilter;
    MembershipMinted(
      tokenId?: BigNumberish | null,
      recipient?: string | null,
      expirationTimestamp?: null,
    ): MembershipMintedEventFilter;

    "MembershipPurchased(uint256,address,uint256)"(
      tokenId?: BigNumberish | null,
      recipient?: string | null,
      expirationTimestamp?: null,
    ): MembershipPurchasedEventFilter;
    MembershipPurchased(
      tokenId?: BigNumberish | null,
      recipient?: string | null,
      expirationTimestamp?: null,
    ): MembershipPurchasedEventFilter;

    "MembershipRenewed(uint256,uint256)"(
      tokenId?: BigNumberish | null,
      newExpirationTimestamp?: null,
    ): MembershipRenewedEventFilter;
    MembershipRenewed(tokenId?: BigNumberish | null, newExpirationTimestamp?: null): MembershipRenewedEventFilter;

    "OwnershipTransferred(address,address)"(
      previousOwner?: string | null,
      newOwner?: string | null,
    ): OwnershipTransferredEventFilter;
    OwnershipTransferred(previousOwner?: string | null, newOwner?: string | null): OwnershipTransferredEventFilter;

    "Paused(address)"(account?: null): PausedEventFilter;
    Paused(account?: null): PausedEventFilter;

    "Transfer(address,address,uint256)"(
      from?: string | null,
      to?: string | null,
      tokenId?: BigNumberish | null,
    ): TransferEventFilter;
    Transfer(from?: string | null, to?: string | null, tokenId?: BigNumberish | null): TransferEventFilter;

    "Unpaused(address)"(account?: null): UnpausedEventFilter;
    Unpaused(account?: null): UnpausedEventFilter;

    "Withdrawal(uint256,address,uint256,address)"(
      amount?: null,
      treasury?: string | null,
      fee?: null,
      feeTreasury?: string | null,
    ): WithdrawalEventFilter;
    Withdrawal(amount?: null, treasury?: string | null, fee?: null, feeTreasury?: string | null): WithdrawalEventFilter;
  };

  estimateGas: {
    airdropAmount(overrides?: CallOverrides): Promise<BigNumber>;

    airdropToken(overrides?: CallOverrides): Promise<BigNumber>;

    approve(
      to: string,
      tokenId: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> },
    ): Promise<BigNumber>;

    balanceOf(owner: string, overrides?: CallOverrides): Promise<BigNumber>;

    cap(overrides?: CallOverrides): Promise<BigNumber>;

    changeBaseTokenURI(overrides?: Overrides & { from?: string | Promise<string> }): Promise<BigNumber>;

    contractURI(overrides?: CallOverrides): Promise<BigNumber>;

    expirationTimestampOf(tokenId: BigNumberish, overrides?: CallOverrides): Promise<BigNumber>;

    factory(overrides?: CallOverrides): Promise<BigNumber>;

    getApproved(tokenId: BigNumberish, overrides?: CallOverrides): Promise<BigNumber>;

    hasValidToken(_owner: string, overrides?: CallOverrides): Promise<BigNumber>;

    initialize(
      _owner: string,
      _treasury: string,
      _name: string,
      _symbol: string,
      contractURI_: string,
      baseURI_: string,
      _membership: MembershipStruct,
      overrides?: Overrides & { from?: string | Promise<string> },
    ): Promise<BigNumber>;

    isApprovedForAll(owner: string, operator: string, overrides?: CallOverrides): Promise<BigNumber>;

    isValid(tokenId: BigNumberish, overrides?: CallOverrides): Promise<BigNumber>;

    mint(recipient: string, overrides?: Overrides & { from?: string | Promise<string> }): Promise<BigNumber>;

    name(overrides?: CallOverrides): Promise<BigNumber>;

    owner(overrides?: CallOverrides): Promise<BigNumber>;

    ownerOf(tokenId: BigNumberish, overrides?: CallOverrides): Promise<BigNumber>;

    pause(overrides?: Overrides & { from?: string | Promise<string> }): Promise<BigNumber>;

    paused(overrides?: CallOverrides): Promise<BigNumber>;

    price(overrides?: CallOverrides): Promise<BigNumber>;

    purchase(recipient: string, overrides?: PayableOverrides & { from?: string | Promise<string> }): Promise<BigNumber>;

    renew(
      tokenId: BigNumberish,
      overrides?: PayableOverrides & { from?: string | Promise<string> },
    ): Promise<BigNumber>;

    renounceOwnership(overrides?: Overrides & { from?: string | Promise<string> }): Promise<BigNumber>;

    royaltyInfo(_tokenId: BigNumberish, _salePrice: BigNumberish, overrides?: CallOverrides): Promise<BigNumber>;

    "safeTransferFrom(address,address,uint256)"(
      from: string,
      to: string,
      tokenId: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> },
    ): Promise<BigNumber>;

    "safeTransferFrom(address,address,uint256,bytes)"(
      from: string,
      to: string,
      tokenId: BigNumberish,
      data: BytesLike,
      overrides?: Overrides & { from?: string | Promise<string> },
    ): Promise<BigNumber>;

    setApprovalForAll(
      operator: string,
      approved: boolean,
      overrides?: Overrides & { from?: string | Promise<string> },
    ): Promise<BigNumber>;

    setDefaultRoyalty(
      _receiver: string,
      _feeNumerator: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> },
    ): Promise<BigNumber>;

    supportsInterface(interfaceId: BytesLike, overrides?: CallOverrides): Promise<BigNumber>;

    symbol(overrides?: CallOverrides): Promise<BigNumber>;

    tokenAddress(overrides?: CallOverrides): Promise<BigNumber>;

    tokenByIndex(index: BigNumberish, overrides?: CallOverrides): Promise<BigNumber>;

    tokenOfOwnerByIndex(owner: string, index: BigNumberish, overrides?: CallOverrides): Promise<BigNumber>;

    tokenURI(tokenId: BigNumberish, overrides?: CallOverrides): Promise<BigNumber>;

    totalSupply(overrides?: CallOverrides): Promise<BigNumber>;

    transferFrom(
      from: string,
      to: string,
      tokenId: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> },
    ): Promise<BigNumber>;

    transferOwnership(
      newOwner: string,
      overrides?: Overrides & { from?: string | Promise<string> },
    ): Promise<BigNumber>;

    treasury(overrides?: CallOverrides): Promise<BigNumber>;

    unpause(overrides?: Overrides & { from?: string | Promise<string> }): Promise<BigNumber>;

    validity(overrides?: CallOverrides): Promise<BigNumber>;

    version(overrides?: CallOverrides): Promise<BigNumber>;

    withdraw(overrides?: Overrides & { from?: string | Promise<string> }): Promise<BigNumber>;
  };

  populateTransaction: {
    airdropAmount(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    airdropToken(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    approve(
      to: string,
      tokenId: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> },
    ): Promise<PopulatedTransaction>;

    balanceOf(owner: string, overrides?: CallOverrides): Promise<PopulatedTransaction>;

    cap(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    changeBaseTokenURI(overrides?: Overrides & { from?: string | Promise<string> }): Promise<PopulatedTransaction>;

    contractURI(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    expirationTimestampOf(tokenId: BigNumberish, overrides?: CallOverrides): Promise<PopulatedTransaction>;

    factory(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    getApproved(tokenId: BigNumberish, overrides?: CallOverrides): Promise<PopulatedTransaction>;

    hasValidToken(_owner: string, overrides?: CallOverrides): Promise<PopulatedTransaction>;

    initialize(
      _owner: string,
      _treasury: string,
      _name: string,
      _symbol: string,
      contractURI_: string,
      baseURI_: string,
      _membership: MembershipStruct,
      overrides?: Overrides & { from?: string | Promise<string> },
    ): Promise<PopulatedTransaction>;

    isApprovedForAll(owner: string, operator: string, overrides?: CallOverrides): Promise<PopulatedTransaction>;

    isValid(tokenId: BigNumberish, overrides?: CallOverrides): Promise<PopulatedTransaction>;

    mint(recipient: string, overrides?: Overrides & { from?: string | Promise<string> }): Promise<PopulatedTransaction>;

    name(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    owner(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    ownerOf(tokenId: BigNumberish, overrides?: CallOverrides): Promise<PopulatedTransaction>;

    pause(overrides?: Overrides & { from?: string | Promise<string> }): Promise<PopulatedTransaction>;

    paused(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    price(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    purchase(
      recipient: string,
      overrides?: PayableOverrides & { from?: string | Promise<string> },
    ): Promise<PopulatedTransaction>;

    renew(
      tokenId: BigNumberish,
      overrides?: PayableOverrides & { from?: string | Promise<string> },
    ): Promise<PopulatedTransaction>;

    renounceOwnership(overrides?: Overrides & { from?: string | Promise<string> }): Promise<PopulatedTransaction>;

    royaltyInfo(
      _tokenId: BigNumberish,
      _salePrice: BigNumberish,
      overrides?: CallOverrides,
    ): Promise<PopulatedTransaction>;

    "safeTransferFrom(address,address,uint256)"(
      from: string,
      to: string,
      tokenId: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> },
    ): Promise<PopulatedTransaction>;

    "safeTransferFrom(address,address,uint256,bytes)"(
      from: string,
      to: string,
      tokenId: BigNumberish,
      data: BytesLike,
      overrides?: Overrides & { from?: string | Promise<string> },
    ): Promise<PopulatedTransaction>;

    setApprovalForAll(
      operator: string,
      approved: boolean,
      overrides?: Overrides & { from?: string | Promise<string> },
    ): Promise<PopulatedTransaction>;

    setDefaultRoyalty(
      _receiver: string,
      _feeNumerator: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> },
    ): Promise<PopulatedTransaction>;

    supportsInterface(interfaceId: BytesLike, overrides?: CallOverrides): Promise<PopulatedTransaction>;

    symbol(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    tokenAddress(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    tokenByIndex(index: BigNumberish, overrides?: CallOverrides): Promise<PopulatedTransaction>;

    tokenOfOwnerByIndex(owner: string, index: BigNumberish, overrides?: CallOverrides): Promise<PopulatedTransaction>;

    tokenURI(tokenId: BigNumberish, overrides?: CallOverrides): Promise<PopulatedTransaction>;

    totalSupply(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    transferFrom(
      from: string,
      to: string,
      tokenId: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> },
    ): Promise<PopulatedTransaction>;

    transferOwnership(
      newOwner: string,
      overrides?: Overrides & { from?: string | Promise<string> },
    ): Promise<PopulatedTransaction>;

    treasury(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    unpause(overrides?: Overrides & { from?: string | Promise<string> }): Promise<PopulatedTransaction>;

    validity(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    version(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    withdraw(overrides?: Overrides & { from?: string | Promise<string> }): Promise<PopulatedTransaction>;
  };
}
