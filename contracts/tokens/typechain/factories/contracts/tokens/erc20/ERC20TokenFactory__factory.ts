/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import { Signer, utils, Contract, ContractFactory, Overrides } from "ethers";
import type { Provider, TransactionRequest } from "@ethersproject/providers";
import type { PromiseOrValue } from "../../../../common";
import type {
  ERC20TokenFactory,
  ERC20TokenFactoryInterface,
} from "../../../../contracts/tokens/erc20/ERC20TokenFactory";

const _abi = [
  {
    inputs: [
      {
        internalType: "address",
        name: "_erc20Token",
        type: "address",
      },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "_erc20TokenClone",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "_creator",
        type: "address",
      },
    ],
    name: "ERC20TokenDeployed",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "previousOwner",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "newOwner",
        type: "address",
      },
    ],
    name: "OwnershipTransferred",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "_name",
        type: "string",
      },
      {
        internalType: "string",
        name: "_symbol",
        type: "string",
      },
      {
        internalType: "uint256",
        name: "_initialSupply",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "_mintTo",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "_saltNonce",
        type: "uint256",
      },
    ],
    name: "deployERC20Token",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "erc20Token",
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
    name: "owner",
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
    name: "renounceOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address payable",
        name: "_erc20Token",
        type: "address",
      },
    ],
    name: "setERC20TokenImplAddress",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "newOwner",
        type: "address",
      },
    ],
    name: "transferOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

const _bytecode =
  "0x608060405234801561001057600080fd5b5060405161087e38038061087e83398101604081905261002f91610117565b610038336100c7565b6001600160a01b0381166100a25760405162461bcd60e51b815260206004820152602760248201527f4552525f5f45524332305f544f4b454e5f43414e4e4f545f42455f5a45524f5f6044820152664144445245535360c81b606482015260840160405180910390fd5b600180546001600160a01b0319166001600160a01b0392909216919091179055610147565b600080546001600160a01b038381166001600160a01b0319831681178455604051919092169283917f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e09190a35050565b60006020828403121561012957600080fd5b81516001600160a01b038116811461014057600080fd5b9392505050565b610728806101566000396000f3fe608060405234801561001057600080fd5b50600436106100725760003560e01c80638da5cb5b116100505780638da5cb5b146100c3578063dcd83903146100d4578063f2fde38b146100e757600080fd5b80636a1240b614610077578063715018a61461008c5780638a13eea714610094575b600080fd5b61008a6100853660046104c2565b6100fa565b005b61008a6101b2565b6001546100a7906001600160a01b031681565b6040516001600160a01b03909116815260200160405180910390f35b6000546001600160a01b03166100a7565b6100a76100e2366004610589565b6101c6565b61008a6100f53660046104c2565b6102c3565b610102610353565b6001600160a01b0381166101835760405162461bcd60e51b815260206004820152602760248201527f4552525f5f45524332305f544f4b454e5f43414e4e4f545f42455f5a45524f5f60448201527f414444524553530000000000000000000000000000000000000000000000000060648201526084015b60405180910390fd5b6001805473ffffffffffffffffffffffffffffffffffffffff19166001600160a01b0392909216919091179055565b6101ba610353565b6101c460006103ad565b565b6001546040516000918291610212916001600160a01b0316906101f79033908b908b908b908b908b90602001610635565b6040516020818303038152906040528051906020012061040a565b604051631d1ee28760e21b81529091506001600160a01b0382169063747b8a1c906102499033908b908b908b908b906004016106cb565b600060405180830381600087803b15801561026357600080fd5b505af1158015610277573d6000803e3d6000fd5b50506040516001600160a01b03841681523392507f5cdc88e1068da136baa7128ab464884f8eca2f546d74bc837588ba1262ebc4f0915060200160405180910390a29695505050505050565b6102cb610353565b6001600160a01b0381166103475760405162461bcd60e51b815260206004820152602660248201527f4f776e61626c653a206e6577206f776e657220697320746865207a65726f206160448201527f6464726573730000000000000000000000000000000000000000000000000000606482015260840161017a565b610350816103ad565b50565b6000546001600160a01b031633146101c45760405162461bcd60e51b815260206004820181905260248201527f4f776e61626c653a2063616c6c6572206973206e6f7420746865206f776e6572604482015260640161017a565b600080546001600160a01b0383811673ffffffffffffffffffffffffffffffffffffffff19831681178455604051919092169283917f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e09190a35050565b6000763d602d80600a3d3981f3363d3d373d3d3d363d730000008360601b60e81c176000526e5af43d82803e903d91602b57fd5bf38360781b1760205281603760096000f590506001600160a01b0381166104a75760405162461bcd60e51b815260206004820152601760248201527f455243313136373a2063726561746532206661696c6564000000000000000000604482015260640161017a565b92915050565b6001600160a01b038116811461035057600080fd5b6000602082840312156104d457600080fd5b81356104df816104ad565b9392505050565b634e487b7160e01b600052604160045260246000fd5b600082601f83011261050d57600080fd5b813567ffffffffffffffff80821115610528576105286104e6565b604051601f8301601f19908116603f01168101908282118183101715610550576105506104e6565b8160405283815286602085880101111561056957600080fd5b836020870160208301376000602085830101528094505050505092915050565b600080600080600060a086880312156105a157600080fd5b853567ffffffffffffffff808211156105b957600080fd5b6105c589838a016104fc565b965060208801359150808211156105db57600080fd5b506105e8888289016104fc565b945050604086013592506060860135610600816104ad565b949793965091946080013592915050565b60005b8381101561062c578181015183820152602001610614565b50506000910152565b60006bffffffffffffffffffffffff19808960601b1683528751610660816014860160208c01610611565b875190840190610677816014840160208c01610611565b01601481019690965260609490941b9093166034850152506048830152506068019392505050565b600081518084526106b7816020860160208601610611565b601f01601f19169290920160200192915050565b60006001600160a01b03808816835260a060208401526106ee60a084018861069f565b8381036040850152610700818861069f565b6060850196909652509290921660809091015250939250505056fea164736f6c6343000813000a";

type ERC20TokenFactoryConstructorParams =
  | [signer?: Signer]
  | ConstructorParameters<typeof ContractFactory>;

const isSuperArgs = (
  xs: ERC20TokenFactoryConstructorParams
): xs is ConstructorParameters<typeof ContractFactory> => xs.length > 1;

export class ERC20TokenFactory__factory extends ContractFactory {
  constructor(...args: ERC20TokenFactoryConstructorParams) {
    if (isSuperArgs(args)) {
      super(...args);
    } else {
      super(_abi, _bytecode, args[0]);
    }
  }

  override deploy(
    _erc20Token: PromiseOrValue<string>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<ERC20TokenFactory> {
    return super.deploy(
      _erc20Token,
      overrides || {}
    ) as Promise<ERC20TokenFactory>;
  }
  override getDeployTransaction(
    _erc20Token: PromiseOrValue<string>,
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): TransactionRequest {
    return super.getDeployTransaction(_erc20Token, overrides || {});
  }
  override attach(address: string): ERC20TokenFactory {
    return super.attach(address) as ERC20TokenFactory;
  }
  override connect(signer: Signer): ERC20TokenFactory__factory {
    return super.connect(signer) as ERC20TokenFactory__factory;
  }

  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): ERC20TokenFactoryInterface {
    return new utils.Interface(_abi) as ERC20TokenFactoryInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): ERC20TokenFactory {
    return new Contract(address, _abi, signerOrProvider) as ERC20TokenFactory;
  }
}