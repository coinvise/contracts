// SPDX-License-Identifier: MIT
pragma solidity >=0.8.4;

import { MembershipsProxy } from "../memberships/MembershipsProxy.sol";

contract TestMembershipsFactory {
    function membershipsImpls(uint16 _version) public pure returns (address) {
        return address(0);
    }

    function deployMemberships(address _memberships) external {
        new MembershipsProxy(0, _memberships, "");
    }
}
