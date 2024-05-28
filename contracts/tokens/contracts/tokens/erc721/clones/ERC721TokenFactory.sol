// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";

import "./interfaces/IERC721Token.sol";

/// @title ERC721TokenFactory
/// @notice Factory contract that can deploy ERC721, ERC721 Soulbound tokens for use on Coinvise Campaigns
/// @author Coinvise
contract ERC721TokenFactory is Ownable {
  /// @notice Emitted when trying to set `erc721TokenImpl`, `erc721SoulboundTokenImpl` to zero address
  error InvalidAddress();

  /// @notice Emitted when an ERC721Token clone is deployed
  /// @param _tokenType type of token deployed
  /// @param _erc721TokenClone address of the deployed clone
  /// @param _creator address of the creator of the deployed clone
  /// @param _erc721TokenImpl address of the implementation used for the deployed clone
  event ERC721TokenDeployed(
    TokenType indexed _tokenType,
    address _erc721TokenClone,
    address indexed _creator,
    address indexed _erc721TokenImpl
  );

  /// @notice Emitted when erc721TokenImpl is changed
  /// @param _oldERC721TokenImpl old erc721TokenImpl
  /// @param _newERC721TokenImpl new erc721TokenImpl
  event ERC721TokenImplSet(
    address _oldERC721TokenImpl,
    address _newERC721TokenImpl
  );

  /// @notice Emitted when erc721SoulboundTokenImpl is changed
  /// @param _oldERC721SoulboundTokenImpl old erc721SoulboundTokenImpl
  /// @param _newERC721SoulboundTokenImpl new erc721SoulboundTokenImpl
  event ERC721SoulboundTokenImplSet(
    address _oldERC721SoulboundTokenImpl,
    address _newERC721SoulboundTokenImpl
  );

  /// @notice Enum to differentiate type of token to deploy
  enum TokenType {
    ERC721Token,
    ERC721SoulboundToken
  }

  /// @notice Implementation contract address used to deploy ERC721Token clones
  address public erc721TokenImpl;

  /// @notice Implementation contract address used to deploy ERC721SoulboundToken clones
  address public erc721SoulboundTokenImpl;

  /// @notice Sets `_erc721TokenImpl`, `_erc721SoulboundTokenImpl`
  /// @dev Reverts if `_erc721TokenImpl` or `_erc721SoulboundTokenImpl` param is address(0)
  /// @param _erc721TokenImpl ERC721Token implementation contract address
  /// @param _erc721SoulboundTokenImpl ERC721SoulboundToken implementation contract address
  constructor(address _erc721TokenImpl, address _erc721SoulboundTokenImpl) {
    assembly {
      // if (_erc721TokenImpl == address(0) || _erc721SoulboundTokenImpl == address(0))
      if or(iszero(_erc721TokenImpl), iszero(_erc721SoulboundTokenImpl)) {
        mstore(0x00, 0xe6c4247b) // revert InvalidAddress();
        revert(0x1c, 0x04)
      }
    }

    erc721TokenImpl = _erc721TokenImpl;
    erc721SoulboundTokenImpl = _erc721SoulboundTokenImpl;
  }

  /// @notice Deploys and initializes a new ERC721Token | ERC721SoulboundToken clone with the params
  /// @dev Uses all token params + `_saltNonce` to calculate salt for clone.
  ///      Emits `ERC721TokenDeployed` or `ERC721SoulboundTokenDeployed`
  /// @param _tokenType Enum to differentiate type of token to deploy: ERC721Token | ERC721SoulboundToken
  /// @param _initializationData ABI encoded data to initialize token
  /// @param _saltNonce Salt nonce to be used for the clone
  /// @return Address of the newly deployed clone
  function deployERC721Token(
    TokenType _tokenType,
    bytes memory _initializationData,
    uint256 _saltNonce
  ) external payable returns (address) {
    address impl = _tokenType == TokenType.ERC721Token
      ? erc721TokenImpl
      : erc721SoulboundTokenImpl;
    address erc721TokenClone = Clones.cloneDeterministic(
      impl,
      keccak256(abi.encodePacked(msg.sender, _initializationData, _saltNonce))
    );
    IERC721Token(erc721TokenClone).initialize{value: msg.value}(
      _initializationData
    );

    assembly {
      let memPtr := mload(64)
      mstore(memPtr, erc721TokenClone)
      log4(
        memPtr,
        32, // _erc721TokenClone
        0x23899f3b1fe55da77188b135df7513bf63e425a3958ee2866b3a19547c56effe, // ERC721TokenDeployed(uint8,address,address,address)
        _tokenType, // _tokenType
        caller(), // _creator
        impl // _erc721TokenImpl
      )
    }

    return erc721TokenClone;
  }

  /// @notice Set ERC721Token implementation contract address
  /// @dev Callable only by `owner`.
  ///      Reverts if `_erc721TokenImpl` is address(0).
  ///      Emits `ERC721TokenImplSet`
  /// @param _erc721TokenImpl ERC721Token implementation contract address
  function setERC721TokenImplAddress(
    address _erc721TokenImpl
  ) external onlyOwner {
    assembly {
      // if (_erc721TokenImpl == address(0))
      if iszero(_erc721TokenImpl) {
        mstore(0x00, 0xe6c4247b) // revert InvalidAddress();
        revert(0x1c, 0x04)
      }
    }

    address _oldERC721TokenImpl = erc721TokenImpl;

    erc721TokenImpl = _erc721TokenImpl;

    assembly {
      let memPtr := mload(64)
      mstore(memPtr, _oldERC721TokenImpl) // _oldERC721TokenImpl
      mstore(add(memPtr, 32), _erc721TokenImpl) // _newERC721TokenImpl
      log1(
        memPtr,
        64,
        0xcbc745d8ffafdbb1db5af2ff6acd261357d2d6fa74ac0ea4389b92c8891a6bd8 // ERC721TokenImplSet(address,address)
      )
    }
  }

  /// @notice Set ERC721SoulboundToken implementation contract address
  /// @dev Callable only by `owner`.
  ///      Reverts if `_erc721SoulboundTokenImpl` is address(0).
  ///      Emits `ERC721SoulboundTokenImplSet`
  /// @param _erc721SoulboundTokenImpl ERC721SoulboundToken implementation contract address
  function setERC721SoulboundTokenImplAddress(
    address _erc721SoulboundTokenImpl
  ) external onlyOwner {
    assembly {
      // if (_erc721SoulboundTokenImpl == address(0))
      if iszero(_erc721SoulboundTokenImpl) {
        mstore(0x00, 0xe6c4247b) // revert InvalidAddress();
        revert(0x1c, 0x04)
      }
    }

    address _oldERC721SoulboundTokenImpl = erc721SoulboundTokenImpl;

    erc721SoulboundTokenImpl = _erc721SoulboundTokenImpl;

    assembly {
      let memPtr := mload(64)
      mstore(memPtr, _oldERC721SoulboundTokenImpl) // _oldERC721SoulboundTokenImpl
      mstore(add(memPtr, 32), _erc721SoulboundTokenImpl) // _newERC721SoulboundTokenImpl
      log1(
        memPtr,
        64,
        0x9367781c37dc381ab012632d88359dc932afe7feabe3bc1a25a1f244c7324d03 // ERC721SoulboundTokenImplSet(address,address)
      )
    }
  }
}
