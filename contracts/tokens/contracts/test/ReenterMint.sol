// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "../tokens/erc721/clones/ERC721TokenImpl.sol";
import "../tokens/erc721/clones/gasless/ERC721TokenNativeGaslessMintImpl.sol";

contract ReenterMintWithReferrer {
  bytes32 r;
  bytes32 s;
  uint8 v;

  function attack(
    address _erc721TokenAddress,
    bytes32 _r,
    bytes32 _s,
    uint8 _v
  ) public payable {
    r = _r;
    s = _s;
    v = _v;
    ERC721TokenImpl(_erc721TokenAddress).mint{value: msg.value}(
      address(this),
      r,
      s,
      v,
      address(0x1337)
    );
  }

  function onERC721Received(
    address /* operator */,
    address /* from */,
    uint256 /* tokenId */,
    bytes calldata /* data */
  ) public {
    ERC721TokenImpl token = ERC721TokenImpl(msg.sender);
    if (token.balanceOf(address(this)) < token.maxSupply())
      token.mint(address(this), r, s, v, address(0x1337));
  }
}

contract ReenterMint {
  bytes32 r;
  bytes32 s;
  uint8 v;

  function attack(
    address _erc721TokenAddress,
    bytes32 _r,
    bytes32 _s,
    uint8 _v
  ) public payable {
    r = _r;
    s = _s;
    v = _v;
    ERC721TokenNativeGaslessMintImpl(_erc721TokenAddress).mint(
      address(this),
      r,
      s,
      v
    );
  }

  function onERC721Received(
    address /* operator */,
    address /* from */,
    uint256 /* tokenId */,
    bytes calldata /* data */
  ) public {
    ERC721TokenNativeGaslessMintImpl token = ERC721TokenNativeGaslessMintImpl(
      msg.sender
    );
    if (token.balanceOf(address(this)) < token.maxSupply())
      token.mint(address(this), r, s, v);
  }
}
