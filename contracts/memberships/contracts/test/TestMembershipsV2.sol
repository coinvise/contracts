// SPDX-License-Identifier: MIT
pragma solidity >=0.8.4;

import { Memberships } from "../memberships/Memberships.sol";
import { IMembershipsMetadataRegistry } from "../memberships-metadata-registry/interfaces/IMembershipsMetadataRegistry.sol";

contract TestMembershipsV2 is Memberships {
    uint256 internal _v2InternalStateVar;

    address public v2PublicStateVar;

    constructor(IMembershipsMetadataRegistry _membershipsMetadataRegistry) Memberships(_membershipsMetadataRegistry) {}

    function isETHAddress(address _address) public pure returns (bool) {
        return _address == ETH_ADDRESS;
    }

    function v2InternalStateVar() public view returns (uint256) {
        return _v2InternalStateVar;
    }

    function setV2InternalStateVar(uint256 v2InternalStateVar_) external {
        _v2InternalStateVar = v2InternalStateVar_;
    }

    function setV2PublicStateVar(address _v2PublicStateVar) external {
        v2PublicStateVar = _v2PublicStateVar;
    }
}
