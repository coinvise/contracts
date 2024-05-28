// SPDX-License-Identifier: MIT
pragma solidity >=0.8.4;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";

contract ERC1155Token is ERC1155 {
    uint256 public nextTokenId = 1;

    // solhint-disable-next-line no-empty-blocks
    constructor() ERC1155("") {}

    function mint(uint256 amount) external {
        _mint(msg.sender, nextTokenId, amount, "");
        nextTokenId += 1;
    }
}
