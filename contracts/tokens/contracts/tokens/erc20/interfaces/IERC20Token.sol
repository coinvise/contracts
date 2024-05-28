// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IERC20Token {
  function initialize(
    address _creator,
    string memory _name,
    string memory _symbol,
    uint256 _initialSupply,
    address _mintTo
  ) external;
}
