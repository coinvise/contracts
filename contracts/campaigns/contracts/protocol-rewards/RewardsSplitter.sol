// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import { ProtocolRewards } from "./ProtocolRewards.sol";

/// @title RewardsSplitter
/// @notice Contract for splitting and depositing rewards
abstract contract RewardsSplitter {
  /// @notice Thrown if zero address or creator and referrer are the same
  error InvalidAddress();

  /// @notice Platform share
  /// @dev 60% = 6000 bps = 0.6e4
  uint256 internal constant PLATFORM_SHARE = 0.6e4;

  /// @notice Creator share
  /// @dev 30% = 3000 bps = 0.3e4
  uint256 internal constant CREATOR_SHARE = 0.3e4;

  /// @notice Referrer share
  /// @dev 10% = 1000 bps = 0.1e4
  uint256 internal constant REFERRER_SHARE = 0.1e4;

  /// @notice Basis points denominator
  /// @dev 100% = 10000 bps = 1e4
  uint256 internal constant BASIS_POINTS = 1e4;

  /// @custom:oz-upgrades-unsafe-allow state-variable-immutable
  /// @notice ProtocolRewards contract
  ProtocolRewards public immutable protocolRewards;

  /// @notice RewardsSplitter constructor
  /// @param _protocolRewards ProtocolRewards contract
  /// @custom:oz-upgrades-unsafe-allow constructor
  /// @dev Since only sets immutable variable
  constructor(address _protocolRewards) {
    protocolRewards = ProtocolRewards(_protocolRewards);

    assert(PLATFORM_SHARE + CREATOR_SHARE + REFERRER_SHARE == BASIS_POINTS);
  }

  /// @notice Split and deposit rewards
  /// @dev Calls `splitRewards` and `ProtocolRewards#depositRewards`
  /// @param _amount total amount to split and deposit
  /// @param _platform platform address
  /// @param _creator creator address
  /// @param _referrer referrer address
  function splitAndDepositRewards(
    uint256 _amount,
    address _platform,
    address _creator,
    address _referrer
  ) public payable returns (uint256, uint256, uint256) {
    (uint256 _platformReward, uint256 _creatorReward, uint256 _referrerReward) = splitRewards(
      _amount,
      _platform,
      _creator,
      _referrer
    );

    protocolRewards.depositRewards{ value: _amount }(
      _platform,
      _platformReward,
      _creator,
      _creatorReward,
      _referrer,
      _referrerReward
    );

    return (_platformReward, _creatorReward, _referrerReward);
  }

  /// @notice Split rewards
  /// @dev Splits `_amount` into platform, creator, and referrer rewards,
  ///      based on `PLATFORM_SHARE`, `CREATOR_SHARE`, and `REFERRER_SHARE`
  /// @param _amount total amount to split
  /// @param _platform platform address
  /// @param _creator creator address
  /// @param _referrer referrer address
  function splitRewards(
    uint256 _amount,
    address _platform,
    address _creator,
    address _referrer
  ) public pure returns (uint256, uint256, uint256) {
    assembly {
      _platform := shr(96, shl(96, _platform))
      _creator := shr(96, shl(96, _creator))
      _referrer := shr(96, shl(96, _referrer))

      if or(
        or(
          iszero(_platform), // _platform == address(0)
          iszero(_creator) // _creator == address(0)
        ),
        eq(_referrer, _creator) // _referrer == _creator
      ) {
        mstore(0x00, 0xe6c4247b) // revert InvalidAddress();
        revert(0x1c, 0x04)
      }
    }

    uint256 _platformReward = (_amount * PLATFORM_SHARE) / BASIS_POINTS;
    uint256 _creatorReward = (_amount * CREATOR_SHARE) / BASIS_POINTS;
    uint256 _referrerReward = (_amount * REFERRER_SHARE) / BASIS_POINTS;

    if (_referrer == address(0)) {
      _platformReward += _referrerReward;
      _referrerReward = 0;
    }

    return (_platformReward, _creatorReward, _referrerReward);
  }
}
