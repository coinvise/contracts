// https://eips.ethereum.org/EIPS/eip-20
// SPDX-License-Identifier: MIT
pragma solidity >=0.8.4;

import { IERC20 } from "../interfaces/IERC20.sol";

contract ERC20Token is IERC20 {
  uint256 private constant MAX_UINT256 = 2 ** 256 - 1;
  mapping(address => uint256) public balances;
  mapping(address => mapping(address => uint256)) public allowed;
  uint256 public totalSupply;
  /*
    NOTE:
    The following variables are OPTIONAL vanities. One does not have to include them.
    They allow one to customise the token contract & in no way influences the core functionality.
    Some wallets/interfaces might not even bother to look at this information.
    */
  string public name; //fancy name: eg Simon Bucks
  uint8 public decimals; //How many decimals to show.
  string public symbol; //An identifier: eg SBX

  constructor(string memory _tokenName, string memory _tokenSymbol, uint8 _decimalUnits) {
    name = _tokenName; // Set the name for display purposes
    symbol = _tokenSymbol; // Set the symbol for display purposes
    decimals = _decimalUnits; // Amount of decimals for display purposes
  }

  function transfer(address _to, uint256 _value) public override returns (bool success) {
    require(balances[msg.sender] >= _value, "token balance is lower than the value requested");
    balances[msg.sender] -= _value;
    balances[_to] += _value;
    emit Transfer(msg.sender, _to, _value); //solhint-disable-line indent, no-unused-vars
    return true;
  }

  function transferFrom(address _from, address _to, uint256 _value) public override returns (bool success) {
    uint256 _allowance = allowed[_from][msg.sender];
    require(
      balances[_from] >= _value && _allowance >= _value,
      "token balance or allowance is lower than amount requested"
    );
    balances[_to] += _value;
    balances[_from] -= _value;
    if (_allowance < MAX_UINT256) {
      allowed[_from][msg.sender] -= _value;
    }
    emit Transfer(_from, _to, _value); //solhint-disable-line indent, no-unused-vars
    return true;
  }

  function balanceOf(address _owner) public view override returns (uint256 balance) {
    return balances[_owner];
  }

  function approve(address _spender, uint256 _value) public override returns (bool success) {
    allowed[msg.sender][_spender] = _value;
    emit Approval(msg.sender, _spender, _value); //solhint-disable-line indent, no-unused-vars
    return true;
  }

  function allowance(address _owner, address _spender) public view override returns (uint256 remaining) {
    return allowed[_owner][_spender];
  }

  function mint(address account, uint256 amount) public {
    totalSupply += amount;
    balances[account] += amount;
    emit Transfer(address(0), account, amount);
  }

  function burn(address account, uint256 amount) public {
    uint256 accountBalance = balances[account];
    require(accountBalance >= amount, "burn amount exceeds balance");
    unchecked {
      balances[account] = accountBalance - amount;
    }
    totalSupply -= amount;
    emit Transfer(account, address(0), amount);
  }
}
