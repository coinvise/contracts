// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";

import "./interfaces/IERC20Token.sol";

contract ERC20TokenFactory is Ownable {
  event ERC20TokenDeployed(address _erc20TokenClone, address indexed _creator);

  address public erc20Token;

  constructor(address _erc20Token) {
    require(
      _erc20Token != address(0),
      "ERR__ERC20_TOKEN_CANNOT_BE_ZERO_ADDRESS"
    );
    erc20Token = _erc20Token;
  }

  function deployERC20Token(
    string memory _name,
    string memory _symbol,
    uint256 _initialSupply,
    address _mintTo,
    uint256 _saltNonce
  ) external returns (address) {
    address erc20TokenClone = Clones.cloneDeterministic(
      erc20Token,
      keccak256(
        abi.encodePacked(
          msg.sender,
          _name,
          _symbol,
          _initialSupply,
          _mintTo,
          _saltNonce
        )
      )
    );
    IERC20Token(erc20TokenClone).initialize(
      msg.sender,
      _name,
      _symbol,
      _initialSupply,
      _mintTo
    );
    emit ERC20TokenDeployed(erc20TokenClone, msg.sender);
    return erc20TokenClone;
  }

  function setERC20TokenImplAddress(address payable _erc20Token)
    external
    onlyOwner
  {
    require(
      _erc20Token != address(0),
      "ERR__ERC20_TOKEN_CANNOT_BE_ZERO_ADDRESS"
    );
    erc20Token = _erc20Token;
  }
}
