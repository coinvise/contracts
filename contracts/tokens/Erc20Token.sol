// SPDX-License-Identifier: MIT
pragma solidity 0.7.4;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20Pausable.sol";

contract ERC20Token is ERC20, ERC20Burnable, ERC20Pausable {
    using SafeMath for uint256;

    uint256 private _supplyCap;
    address _minter;

    constructor(
        string memory name,
        string memory symbol,
        address minter,
        uint256 supplyCap,
        uint256 integrationFee
    ) ERC20(name, symbol) {
        _supplyCap = supplyCap;
        _minter = minter != address(0) ? minter : msg.sender;
        _mint(_minter, _supplyCap.sub(integrationFee));
        if (integrationFee > 0) {
            _mint(
                address(0x8df737904ab678B99717EF553b4eFdA6E3f94589),
                integrationFee
            );
        }
    }

    /**
     * @dev Returns the cap on the token's total supply.
     */
    function cap() public view returns (uint256) {
        return _supplyCap;
    }

    /**
     * @dev Override mint from ERC20.sol.
     *
     * Requirements:
     * - `value` must not cause the total supply to go over the cap.
     */
    function _mint(address account, uint256 value) internal override {
        require(
            _supplyCap == 0 || totalSupply().add(value) <= _supplyCap,
            "Cap exceeded"
        );

        super._mint(account, value);
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override(ERC20, ERC20Pausable) {
        super._beforeTokenTransfer(from, to, amount);
    }

    function pause() external {
        require(msg.sender == _minter, "UNAUTHORIZED");
        _pause();
    }

    function unpause() external {
        require(msg.sender == _minter, "UNAUTHORIZED");
        _unpause();
    }
}
