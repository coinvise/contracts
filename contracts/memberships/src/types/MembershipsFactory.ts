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

export interface MembershipsFactoryInterface extends ethers.utils.Interface {
  functions: {
    "deployMemberships(address,address,string,string,string,string,(address,uint256,uint256,uint256,address,uint256))": FunctionFragment;
    "deployMembershipsAtVersion(uint16,address,address,string,string,string,string,(address,uint256,uint256,uint256,address,uint256))": FunctionFragment;
    "feeBPS()": FunctionFragment;
    "feeTreasury()": FunctionFragment;
    "membershipsImpls(uint16)": FunctionFragment;
    "membershipsLatestVersion()": FunctionFragment;
    "owner()": FunctionFragment;
    "renounceOwnership()": FunctionFragment;
    "setFeeBPS(uint16)": FunctionFragment;
    "setFeeTreasury(address)": FunctionFragment;
    "setMembershipsImplAddress(uint16,address)": FunctionFragment;
    "transferOwnership(address)": FunctionFragment;
    "upgradeProxy(uint16,address)": FunctionFragment;
  };

  encodeFunctionData(
    functionFragment: "deployMemberships",
    values: [string, string, string, string, string, string, MembershipStruct],
  ): string;
  encodeFunctionData(
    functionFragment: "deployMembershipsAtVersion",
    values: [BigNumberish, string, string, string, string, string, string, MembershipStruct],
  ): string;
  encodeFunctionData(functionFragment: "feeBPS", values?: undefined): string;
  encodeFunctionData(functionFragment: "feeTreasury", values?: undefined): string;
  encodeFunctionData(functionFragment: "membershipsImpls", values: [BigNumberish]): string;
  encodeFunctionData(functionFragment: "membershipsLatestVersion", values?: undefined): string;
  encodeFunctionData(functionFragment: "owner", values?: undefined): string;
  encodeFunctionData(functionFragment: "renounceOwnership", values?: undefined): string;
  encodeFunctionData(functionFragment: "setFeeBPS", values: [BigNumberish]): string;
  encodeFunctionData(functionFragment: "setFeeTreasury", values: [string]): string;
  encodeFunctionData(functionFragment: "setMembershipsImplAddress", values: [BigNumberish, string]): string;
  encodeFunctionData(functionFragment: "transferOwnership", values: [string]): string;
  encodeFunctionData(functionFragment: "upgradeProxy", values: [BigNumberish, string]): string;

  decodeFunctionResult(functionFragment: "deployMemberships", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "deployMembershipsAtVersion", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "feeBPS", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "feeTreasury", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "membershipsImpls", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "membershipsLatestVersion", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "owner", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "renounceOwnership", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "setFeeBPS", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "setFeeTreasury", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "setMembershipsImplAddress", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "transferOwnership", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "upgradeProxy", data: BytesLike): Result;

  events: {
    "FeeBPSSet(uint16,uint16)": EventFragment;
    "FeeTreasurySet(address,address)": EventFragment;
    "MembershipsDeployed(address,address,address)": EventFragment;
    "MembershipsImplSet(uint16,address)": EventFragment;
    "OwnershipTransferred(address,address)": EventFragment;
  };

  getEvent(nameOrSignatureOrTopic: "FeeBPSSet"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "FeeTreasurySet"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "MembershipsDeployed"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "MembershipsImplSet"): EventFragment;
  getEvent(nameOrSignatureOrTopic: "OwnershipTransferred"): EventFragment;
}

export type FeeBPSSetEvent = TypedEvent<[number, number], { oldFeeBPS: number; newFeeBPS: number }>;

export type FeeBPSSetEventFilter = TypedEventFilter<FeeBPSSetEvent>;

export type FeeTreasurySetEvent = TypedEvent<[string, string], { oldFeeTreasury: string; newFeeTreasury: string }>;

export type FeeTreasurySetEventFilter = TypedEventFilter<FeeTreasurySetEvent>;

export type MembershipsDeployedEvent = TypedEvent<
  [string, string, string],
  { membershipsProxy: string; owner: string; implementation: string }
>;

export type MembershipsDeployedEventFilter = TypedEventFilter<MembershipsDeployedEvent>;

export type MembershipsImplSetEvent = TypedEvent<[number, string], { version: number; implementation: string }>;

export type MembershipsImplSetEventFilter = TypedEventFilter<MembershipsImplSetEvent>;

export type OwnershipTransferredEvent = TypedEvent<[string, string], { previousOwner: string; newOwner: string }>;

export type OwnershipTransferredEventFilter = TypedEventFilter<OwnershipTransferredEvent>;

export interface MembershipsFactory extends BaseContract {
  connect(signerOrProvider: Signer | Provider | string): this;
  attach(addressOrName: string): this;
  deployed(): Promise<this>;

  interface: MembershipsFactoryInterface;

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
    deployMemberships(
      _owner: string,
      _treasury: string,
      _name: string,
      _symbol: string,
      contractURI_: string,
      baseURI_: string,
      _membership: MembershipStruct,
      overrides?: Overrides & { from?: string | Promise<string> },
    ): Promise<ContractTransaction>;

    deployMembershipsAtVersion(
      _version: BigNumberish,
      _owner: string,
      _treasury: string,
      _name: string,
      _symbol: string,
      contractURI_: string,
      baseURI_: string,
      _membership: MembershipStruct,
      overrides?: Overrides & { from?: string | Promise<string> },
    ): Promise<ContractTransaction>;

    feeBPS(overrides?: CallOverrides): Promise<[number]>;

    feeTreasury(overrides?: CallOverrides): Promise<[string]>;

    membershipsImpls(_version: BigNumberish, overrides?: CallOverrides): Promise<[string]>;

    membershipsLatestVersion(overrides?: CallOverrides): Promise<[number]>;

    owner(overrides?: CallOverrides): Promise<[string]>;

    renounceOwnership(overrides?: Overrides & { from?: string | Promise<string> }): Promise<ContractTransaction>;

    setFeeBPS(
      _feeBPS: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> },
    ): Promise<ContractTransaction>;

    setFeeTreasury(
      _feeTreasury: string,
      overrides?: Overrides & { from?: string | Promise<string> },
    ): Promise<ContractTransaction>;

    setMembershipsImplAddress(
      _version: BigNumberish,
      _memberships: string,
      overrides?: Overrides & { from?: string | Promise<string> },
    ): Promise<ContractTransaction>;

    transferOwnership(
      newOwner: string,
      overrides?: Overrides & { from?: string | Promise<string> },
    ): Promise<ContractTransaction>;

    upgradeProxy(
      _version: BigNumberish,
      _membershipsProxy: string,
      overrides?: Overrides & { from?: string | Promise<string> },
    ): Promise<ContractTransaction>;
  };

  deployMemberships(
    _owner: string,
    _treasury: string,
    _name: string,
    _symbol: string,
    contractURI_: string,
    baseURI_: string,
    _membership: MembershipStruct,
    overrides?: Overrides & { from?: string | Promise<string> },
  ): Promise<ContractTransaction>;

  deployMembershipsAtVersion(
    _version: BigNumberish,
    _owner: string,
    _treasury: string,
    _name: string,
    _symbol: string,
    contractURI_: string,
    baseURI_: string,
    _membership: MembershipStruct,
    overrides?: Overrides & { from?: string | Promise<string> },
  ): Promise<ContractTransaction>;

  feeBPS(overrides?: CallOverrides): Promise<number>;

  feeTreasury(overrides?: CallOverrides): Promise<string>;

  membershipsImpls(_version: BigNumberish, overrides?: CallOverrides): Promise<string>;

  membershipsLatestVersion(overrides?: CallOverrides): Promise<number>;

  owner(overrides?: CallOverrides): Promise<string>;

  renounceOwnership(overrides?: Overrides & { from?: string | Promise<string> }): Promise<ContractTransaction>;

  setFeeBPS(
    _feeBPS: BigNumberish,
    overrides?: Overrides & { from?: string | Promise<string> },
  ): Promise<ContractTransaction>;

  setFeeTreasury(
    _feeTreasury: string,
    overrides?: Overrides & { from?: string | Promise<string> },
  ): Promise<ContractTransaction>;

  setMembershipsImplAddress(
    _version: BigNumberish,
    _memberships: string,
    overrides?: Overrides & { from?: string | Promise<string> },
  ): Promise<ContractTransaction>;

  transferOwnership(
    newOwner: string,
    overrides?: Overrides & { from?: string | Promise<string> },
  ): Promise<ContractTransaction>;

  upgradeProxy(
    _version: BigNumberish,
    _membershipsProxy: string,
    overrides?: Overrides & { from?: string | Promise<string> },
  ): Promise<ContractTransaction>;

  callStatic: {
    deployMemberships(
      _owner: string,
      _treasury: string,
      _name: string,
      _symbol: string,
      contractURI_: string,
      baseURI_: string,
      _membership: MembershipStruct,
      overrides?: CallOverrides,
    ): Promise<string>;

    deployMembershipsAtVersion(
      _version: BigNumberish,
      _owner: string,
      _treasury: string,
      _name: string,
      _symbol: string,
      contractURI_: string,
      baseURI_: string,
      _membership: MembershipStruct,
      overrides?: CallOverrides,
    ): Promise<string>;

    feeBPS(overrides?: CallOverrides): Promise<number>;

    feeTreasury(overrides?: CallOverrides): Promise<string>;

    membershipsImpls(_version: BigNumberish, overrides?: CallOverrides): Promise<string>;

    membershipsLatestVersion(overrides?: CallOverrides): Promise<number>;

    owner(overrides?: CallOverrides): Promise<string>;

    renounceOwnership(overrides?: CallOverrides): Promise<void>;

    setFeeBPS(_feeBPS: BigNumberish, overrides?: CallOverrides): Promise<void>;

    setFeeTreasury(_feeTreasury: string, overrides?: CallOverrides): Promise<void>;

    setMembershipsImplAddress(_version: BigNumberish, _memberships: string, overrides?: CallOverrides): Promise<void>;

    transferOwnership(newOwner: string, overrides?: CallOverrides): Promise<void>;

    upgradeProxy(_version: BigNumberish, _membershipsProxy: string, overrides?: CallOverrides): Promise<void>;
  };

  filters: {
    "FeeBPSSet(uint16,uint16)"(oldFeeBPS?: null, newFeeBPS?: null): FeeBPSSetEventFilter;
    FeeBPSSet(oldFeeBPS?: null, newFeeBPS?: null): FeeBPSSetEventFilter;

    "FeeTreasurySet(address,address)"(
      oldFeeTreasury?: string | null,
      newFeeTreasury?: string | null,
    ): FeeTreasurySetEventFilter;
    FeeTreasurySet(oldFeeTreasury?: string | null, newFeeTreasury?: string | null): FeeTreasurySetEventFilter;

    "MembershipsDeployed(address,address,address)"(
      membershipsProxy?: string | null,
      owner?: string | null,
      implementation?: string | null,
    ): MembershipsDeployedEventFilter;
    MembershipsDeployed(
      membershipsProxy?: string | null,
      owner?: string | null,
      implementation?: string | null,
    ): MembershipsDeployedEventFilter;

    "MembershipsImplSet(uint16,address)"(
      version?: BigNumberish | null,
      implementation?: string | null,
    ): MembershipsImplSetEventFilter;
    MembershipsImplSet(version?: BigNumberish | null, implementation?: string | null): MembershipsImplSetEventFilter;

    "OwnershipTransferred(address,address)"(
      previousOwner?: string | null,
      newOwner?: string | null,
    ): OwnershipTransferredEventFilter;
    OwnershipTransferred(previousOwner?: string | null, newOwner?: string | null): OwnershipTransferredEventFilter;
  };

  estimateGas: {
    deployMemberships(
      _owner: string,
      _treasury: string,
      _name: string,
      _symbol: string,
      contractURI_: string,
      baseURI_: string,
      _membership: MembershipStruct,
      overrides?: Overrides & { from?: string | Promise<string> },
    ): Promise<BigNumber>;

    deployMembershipsAtVersion(
      _version: BigNumberish,
      _owner: string,
      _treasury: string,
      _name: string,
      _symbol: string,
      contractURI_: string,
      baseURI_: string,
      _membership: MembershipStruct,
      overrides?: Overrides & { from?: string | Promise<string> },
    ): Promise<BigNumber>;

    feeBPS(overrides?: CallOverrides): Promise<BigNumber>;

    feeTreasury(overrides?: CallOverrides): Promise<BigNumber>;

    membershipsImpls(_version: BigNumberish, overrides?: CallOverrides): Promise<BigNumber>;

    membershipsLatestVersion(overrides?: CallOverrides): Promise<BigNumber>;

    owner(overrides?: CallOverrides): Promise<BigNumber>;

    renounceOwnership(overrides?: Overrides & { from?: string | Promise<string> }): Promise<BigNumber>;

    setFeeBPS(_feeBPS: BigNumberish, overrides?: Overrides & { from?: string | Promise<string> }): Promise<BigNumber>;

    setFeeTreasury(
      _feeTreasury: string,
      overrides?: Overrides & { from?: string | Promise<string> },
    ): Promise<BigNumber>;

    setMembershipsImplAddress(
      _version: BigNumberish,
      _memberships: string,
      overrides?: Overrides & { from?: string | Promise<string> },
    ): Promise<BigNumber>;

    transferOwnership(
      newOwner: string,
      overrides?: Overrides & { from?: string | Promise<string> },
    ): Promise<BigNumber>;

    upgradeProxy(
      _version: BigNumberish,
      _membershipsProxy: string,
      overrides?: Overrides & { from?: string | Promise<string> },
    ): Promise<BigNumber>;
  };

  populateTransaction: {
    deployMemberships(
      _owner: string,
      _treasury: string,
      _name: string,
      _symbol: string,
      contractURI_: string,
      baseURI_: string,
      _membership: MembershipStruct,
      overrides?: Overrides & { from?: string | Promise<string> },
    ): Promise<PopulatedTransaction>;

    deployMembershipsAtVersion(
      _version: BigNumberish,
      _owner: string,
      _treasury: string,
      _name: string,
      _symbol: string,
      contractURI_: string,
      baseURI_: string,
      _membership: MembershipStruct,
      overrides?: Overrides & { from?: string | Promise<string> },
    ): Promise<PopulatedTransaction>;

    feeBPS(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    feeTreasury(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    membershipsImpls(_version: BigNumberish, overrides?: CallOverrides): Promise<PopulatedTransaction>;

    membershipsLatestVersion(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    owner(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    renounceOwnership(overrides?: Overrides & { from?: string | Promise<string> }): Promise<PopulatedTransaction>;

    setFeeBPS(
      _feeBPS: BigNumberish,
      overrides?: Overrides & { from?: string | Promise<string> },
    ): Promise<PopulatedTransaction>;

    setFeeTreasury(
      _feeTreasury: string,
      overrides?: Overrides & { from?: string | Promise<string> },
    ): Promise<PopulatedTransaction>;

    setMembershipsImplAddress(
      _version: BigNumberish,
      _memberships: string,
      overrides?: Overrides & { from?: string | Promise<string> },
    ): Promise<PopulatedTransaction>;

    transferOwnership(
      newOwner: string,
      overrides?: Overrides & { from?: string | Promise<string> },
    ): Promise<PopulatedTransaction>;

    upgradeProxy(
      _version: BigNumberish,
      _membershipsProxy: string,
      overrides?: Overrides & { from?: string | Promise<string> },
    ): Promise<PopulatedTransaction>;
  };
}