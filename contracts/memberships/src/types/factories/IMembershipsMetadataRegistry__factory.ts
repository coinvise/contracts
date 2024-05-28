/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Contract, Signer, utils } from "ethers";
import { Provider } from "@ethersproject/providers";
import type {
  IMembershipsMetadataRegistry,
  IMembershipsMetadataRegistryInterface,
} from "../IMembershipsMetadataRegistry";

const _abi = [
  {
    inputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    name: "baseTokenURI",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_membershipsProxy",
        type: "address",
      },
      {
        internalType: "string",
        name: "_baseTokenURI",
        type: "string",
      },
    ],
    name: "setBaseTokenURI",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];

export class IMembershipsMetadataRegistry__factory {
  static readonly abi = _abi;
  static createInterface(): IMembershipsMetadataRegistryInterface {
    return new utils.Interface(_abi) as IMembershipsMetadataRegistryInterface;
  }
  static connect(address: string, signerOrProvider: Signer | Provider): IMembershipsMetadataRegistry {
    return new Contract(address, _abi, signerOrProvider) as IMembershipsMetadataRegistry;
  }
}