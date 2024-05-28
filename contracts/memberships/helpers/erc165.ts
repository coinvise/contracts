import { solidityKeccak256 } from "ethers/lib/utils";

// Adapted from https://github.com/OpenZeppelin/openzeppelin-contracts-upgradeable/blob/master/test/utils/introspection/SupportsInterface.behavior.js
export const INTERFACES: {
  [key: string]: string[];
} = {
  ERC165: ["supportsInterface(bytes4)"],
  ERC721: [
    "balanceOf(address)",
    "ownerOf(uint256)",
    "approve(address,uint256)",
    "getApproved(uint256)",
    "setApprovalForAll(address,bool)",
    "isApprovedForAll(address,address)",
    "transferFrom(address,address,uint256)",
    "safeTransferFrom(address,address,uint256)",
    "safeTransferFrom(address,address,uint256,bytes)",
  ],
  ERC721Metadata: ["name()", "symbol()", "tokenURI(uint256)"],
  ERC2981: ["royaltyInfo(uint256,uint256)"],
};

export const INTERFACE_IDS: { [key: string]: string } = {};
for (const k of Object.getOwnPropertyNames(INTERFACES)) {
  INTERFACE_IDS[k] = ERC165(INTERFACES[k]);
}

// Adapted from https://github.com/OpenZeppelin/openzeppelin-test-helpers/blob/master/src/makeInterfaceId.js
export function ERC165(functionSignatures: string[] = []) {
  const INTERFACE_ID_LENGTH = 4;

  const interfaceIdBuffer = functionSignatures
    .map(signature => solidityKeccak256(["string"], [signature])) // keccak256
    .map(
      h => Buffer.from(h.substring(2), "hex").slice(0, 4), // bytes4()
    )
    .reduce((memo, bytes) => {
      for (let i = 0; i < INTERFACE_ID_LENGTH; i++) {
        memo[i] = memo[i] ^ bytes[i]; // xor
      }
      return memo;
    }, Buffer.alloc(INTERFACE_ID_LENGTH));

  return `0x${interfaceIdBuffer.toString("hex")}`;
}
