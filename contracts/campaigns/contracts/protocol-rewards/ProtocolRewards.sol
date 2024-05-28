// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

/// @title ProtocolRewards
/// @author Coinvise
/// @notice Contract for distributing protocol rewards
contract ProtocolRewards {
  /// @notice Thrown if total ether transfer doesn't match constituent rewards in `depositRewards`
  error InvalidAmount();

  /// @notice Thrown if ether transfer fails in `withdrawRewards`
  error TransferFailed();

  /// @notice Emitted when rewards are deposited
  /// @param sender sender address
  /// @param _platform platform address
  /// @param _platformReward platform reward
  /// @param _creator creator address
  /// @param _creatorReward creator reward
  /// @param _referrer referrer address
  /// @param _referrerReward referrer reward
  event RewardsDeposited(
    address sender,
    address indexed _platform,
    uint256 _platformReward,
    address indexed _creator,
    uint256 _creatorReward,
    address indexed _referrer,
    uint256 _referrerReward
  );

  /// @notice Emitted when rewards are withdrawn
  /// @param _account account address
  /// @param _amount amount withdrawn
  event Withdrawal(address indexed _account, uint256 _amount);

  /// @notice Mapping of account to rewards balance
  mapping(address => uint256) public balanceOf;

  /// @notice Deposit rewards
  /// @dev Increments balance of each account
  /// @param _platform platform address
  /// @param _platformReward platform reward
  /// @param _creator creator address
  /// @param _creatorReward creator reward
  /// @param _referrer referrer address
  /// @param _referrerReward referrer reward
  function depositRewards(
    address _platform,
    uint256 _platformReward,
    address _creator,
    uint256 _creatorReward,
    address _referrer,
    uint256 _referrerReward
  ) external payable {
    if (msg.value != (_platformReward + _creatorReward + _referrerReward)) {
      assembly {
        mstore(0x00, 0x2c5211c6) // revert InvalidAmount();
        revert(0x1c, 0x04)
      }
    }

    if (_platform != address(0) && _platformReward > 0) balanceOf[_platform] += _platformReward;
    if (_creator != address(0) && _creatorReward > 0) balanceOf[_creator] += _creatorReward;
    if (_referrer != address(0) && _referrerReward > 0) balanceOf[_referrer] += _referrerReward;

    assembly {
      let memPtr := mload(64)
      mstore(memPtr, caller())
      mstore(add(memPtr, 32), _platformReward)
      mstore(add(memPtr, 64), _creatorReward)
      mstore(add(memPtr, 96), _referrerReward)
      log4(
        memPtr,
        128, // sender, _platformReward, _creatorReward, _referrerReward
        0xea2fdf7406d73ac5543899b986199b33f5d424510e1cef6a9d120ce546868bca, // RewardsDeposited
        shr(96, shl(96, _platform)), // _platform
        shr(96, shl(96, _creator)), // _creator
        shr(96, shl(96, _referrer)) // _referrer
      )
    }
  }

  /// @notice Withdraw rewards
  /// @dev Decrements balance of account and transfers ether
  /// @param _account account address
  function withdrawRewards(address payable _account) external {
    uint256 _amount = balanceOf[_account];
    assembly {
      // if (_amount == 0) return
      if iszero(_amount) {
        return(0, 0)
      }
    }

    balanceOf[_account] = 0;

    assembly {
      // _account.call{value: _amount}("");
      if iszero(call(gas(), _account, _amount, 0, 0, 0, 0)) {
        mstore(0x00, 0x90b8ec18) // revert TransferFailed();
        revert(0x1c, 0x04)
      }

      let memPtr := mload(64)
      mstore(memPtr, _amount)
      log2(
        memPtr,
        32, // _amount
        0x7fcf532c15f0a6db0bd6d0e038bea71d30d808c7d98cb3bf7268a95bf5081b65, // Withdrawal(address,uint256)
        shr(96, shl(96, _account)) // _account
      )
    }
  }
}
