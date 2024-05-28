// SPDX-License-Identifier: MIT
pragma solidity >=0.8.4;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract ERC721Token is ERC721 {
    uint256 public nextTokenId = 1;

    // solhint-disable-next-line no-empty-blocks
    constructor() ERC721("TestToken", "TEST") {}

    // @dev mint 1 token for any request
    function mint() external {
        _mint(msg.sender, nextTokenId);
        nextTokenId += 1;
    }
}
