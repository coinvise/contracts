// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20BurnableUpgradeable.sol";

/**
 * @dev ERC20 token, including:
 *
 *  - ability for holders to burn (destroy) their tokens
 *  - a pauser role that allows to stop all token transfers
 *
 * The account that deploys the contract will be granted pauser
 * roles, as well as the default admin role, which will let it grant pauser roles to other accounts.
 */
contract ERC20Token is
  AccessControlUpgradeable,
  ERC20PausableUpgradeable,
  ERC20BurnableUpgradeable
{
  address public creator;

  bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

  constructor() initializer {}

  /**
   * @dev Grants `DEFAULT_ADMIN_ROLE` and `PAUSER_ROLE` to the _creator
   * Mints initialSupply tokens to _mintTo
   */
  function initialize(
    address _creator,
    string memory _name,
    string memory _symbol,
    uint256 _initialSupply,
    address _mintTo
  ) public initializer {
    creator = _creator;

    __ERC20_init(_name, _symbol);
    __AccessControl_init();
    __ERC20Pausable_init();
    __ERC20Burnable_init();

    _setupRole(DEFAULT_ADMIN_ROLE, _creator);
    _setupRole(PAUSER_ROLE, _creator);

    _mint(_mintTo, _initialSupply);
  }

  /**
   * @dev Pauses all token transfers.
   * Caller must have the `PAUSER_ROLE`.
   */
  function pause() public virtual {
    require(
      hasRole(PAUSER_ROLE, msg.sender),
      "ERC20Token: must have pauser role to pause"
    );
    _pause();
  }

  /**
   * @dev Unpauses all token transfers.
   * Caller must have the `PAUSER_ROLE`.
   */
  function unpause() public virtual {
    require(
      hasRole(PAUSER_ROLE, msg.sender),
      "ERC20Token: must have pauser role to unpause"
    );
    _unpause();
  }

  function _beforeTokenTransfer(
    address from,
    address to,
    uint256 amount
  ) internal virtual override(ERC20Upgradeable, ERC20PausableUpgradeable) {
    super._beforeTokenTransfer(from, to, amount);
  }
}
