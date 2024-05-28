// SPDX-License-Identifier: MIT
pragma solidity >=0.8.4;

import { Campaigns } from "../campaigns/Campaigns.sol";

contract RevertOnReceiveEther {
  receive() external payable {
    revert();
  }

  function claim(
    Campaigns _campaigns,
    address _campaignManager,
    uint256 _campaignId,
    bytes32 r,
    bytes32 s,
    uint8 v
  ) external payable {
    _campaigns.claim{ value: msg.value }(_campaignManager, _campaignId, r, s, v, address(0x1337));
  }
}
