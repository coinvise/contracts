// https://eips.ethereum.org/EIPS/eip-20
// SPDX-License-Identifier: MIT
pragma solidity >=0.8.4;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract ERC20Token is ERC20 {
    // solhint-disable-next-line no-empty-blocks
    constructor() ERC20("TestToken", "TEST") {}

    // @dev mint 1 TEST for any request
    function mint() external {
        _mint(msg.sender, 10**this.decimals());
    }
}
