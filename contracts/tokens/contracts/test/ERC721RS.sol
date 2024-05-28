// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {RewardsSplitter} from "../protocol-rewards/RewardsSplitter.sol";

contract ERC721RS is ERC721, RewardsSplitter {
  constructor(
    string memory _name,
    string memory _symbol,
    address _protocolRewards
  ) ERC721(_name, _symbol) RewardsSplitter(_protocolRewards) {}
}
