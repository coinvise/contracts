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

export interface IMembershipsProxyInterface extends ethers.utils.Interface {
  functions: {
    "memberships()": FunctionFragment;
    "membershipsFactory()": FunctionFragment;
    "upgradeMemberships(address)": FunctionFragment;
  };

  encodeFunctionData(functionFragment: "memberships", values?: undefined): string;
  encodeFunctionData(functionFragment: "membershipsFactory", values?: undefined): string;
  encodeFunctionData(functionFragment: "upgradeMemberships", values: [string]): string;

  decodeFunctionResult(functionFragment: "memberships", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "membershipsFactory", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "upgradeMemberships", data: BytesLike): Result;

  events: {};
}

export interface IMembershipsProxy extends BaseContract {
  connect(signerOrProvider: Signer | Provider | string): this;
  attach(addressOrName: string): this;
  deployed(): Promise<this>;

  interface: IMembershipsProxyInterface;

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
    memberships(overrides?: CallOverrides): Promise<[string]>;

    membershipsFactory(overrides?: CallOverrides): Promise<[string]>;

    upgradeMemberships(
      _memberships: string,
      overrides?: Overrides & { from?: string | Promise<string> },
    ): Promise<ContractTransaction>;
  };

  memberships(overrides?: CallOverrides): Promise<string>;

  membershipsFactory(overrides?: CallOverrides): Promise<string>;

  upgradeMemberships(
    _memberships: string,
    overrides?: Overrides & { from?: string | Promise<string> },
  ): Promise<ContractTransaction>;

  callStatic: {
    memberships(overrides?: CallOverrides): Promise<string>;

    membershipsFactory(overrides?: CallOverrides): Promise<string>;

    upgradeMemberships(_memberships: string, overrides?: CallOverrides): Promise<void>;
  };

  filters: {};

  estimateGas: {
    memberships(overrides?: CallOverrides): Promise<BigNumber>;

    membershipsFactory(overrides?: CallOverrides): Promise<BigNumber>;

    upgradeMemberships(
      _memberships: string,
      overrides?: Overrides & { from?: string | Promise<string> },
    ): Promise<BigNumber>;
  };

  populateTransaction: {
    memberships(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    membershipsFactory(overrides?: CallOverrides): Promise<PopulatedTransaction>;

    upgradeMemberships(
      _memberships: string,
      overrides?: Overrides & { from?: string | Promise<string> },
    ): Promise<PopulatedTransaction>;
  };
}