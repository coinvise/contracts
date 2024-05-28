/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Contract, Signer, utils } from "ethers";
import { Provider } from "@ethersproject/providers";
import type { IMembershipsProxy, IMembershipsProxyInterface } from "../IMembershipsProxy";

const _abi = [
  {
    inputs: [],
    name: "memberships",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "membershipsFactory",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_memberships",
        type: "address",
      },
    ],
    name: "upgradeMemberships",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];

export class IMembershipsProxy__factory {
  static readonly abi = _abi;
  static createInterface(): IMembershipsProxyInterface {
    return new utils.Interface(_abi) as IMembershipsProxyInterface;
  }
  static connect(address: string, signerOrProvider: Signer | Provider): IMembershipsProxy {
    return new Contract(address, _abi, signerOrProvider) as IMembershipsProxy;
  }
}
