// SPDX-License-Identifier: MIT
pragma solidity >=0.8.4;

import { Memberships } from "../memberships/Memberships.sol";
import { TestMembershipsV2 } from "./TestMembershipsV2.sol";
import { IMembershipsMetadataRegistry } from "../memberships-metadata-registry/interfaces/IMembershipsMetadataRegistry.sol";

contract TestMembershipsV3 is Memberships, TestMembershipsV2 {
    uint256 internal _v3InternalStateVar;

    address public v3PublicStateVar;

    constructor(IMembershipsMetadataRegistry _membershipsMetadataRegistry)
        TestMembershipsV2(_membershipsMetadataRegistry)
    {}

    function isETHAddressV3(address _address) public pure returns (bool) {
        return _address != ETH_ADDRESS;
    }

    function v3InternalStateVar() public view returns (uint256) {
        return _v3InternalStateVar;
    }

    function setV3InternalStateVar(uint256 v3InternalStateVar_) external {
        _v3InternalStateVar = v3InternalStateVar_;
    }

    function setV3PublicStateVar(address _v3PublicStateVar) external {
        v3PublicStateVar = _v3PublicStateVar;
    }
}
