// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "@openzeppelin/contracts-upgradeable/utils/cryptography/ECDSAUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/cryptography/EIP712Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "../interfaces/IERC721Token.sol";
import "../../../../metatx-standard/EIP712MetaTransactionUpgradeable/EIP712MetaTransactionUpgradeable.sol";

/// @title ERC721 contract with signature-based minting
/// @dev Supports Biconomy's native meta transaction standard
contract ERC721TokenNativeGaslessMintImpl is
  IERC721Token,
  ERC721Upgradeable,
  EIP712Upgradeable,
  EIP712MetaTransactionUpgradeable
{
  /// @notice Emitted when user tries to mint more than once
  error AlreadyClaimed();

  /// @notice Emitted when trying to set `trustedAddress` to zero address, or if signature verification fails during mint()
  error InvalidAddress();

  /// @notice Emitted when user tries to mint beyond maxSupply
  error ExceedsMaxSupply();

  /// @dev Counter for the next tokenID, defaults to 1 for better gas on first mint
  uint256 public nextTokenId;

  /// @notice Token contractURI
  string internal _contractURI;

  /// @notice Token URI
  string internal _tokenURI;

  /// @notice Max allowed token amount
  uint256 public maxSupply;

  /// @notice The owner of this contract (set to the deployer)
  address public owner;

  /// @dev Address used for signatures
  address internal trustedAddress;

  /// @notice Check if NFT has been claimed before
  mapping(address => uint256) public claims;

  bytes32 private constant _MINT_TYPEHASH = keccak256("Mint(address to)");

  constructor() {
    _disableInitializers();
  }

  /// @dev Initialize after deploying clone
  /// @param _initializationData ABI encoded data to initialize token
  function initialize(
    bytes memory _initializationData
  ) public payable initializer {
    (
      string memory _name,
      string memory _symbol,
      string memory contractURI_,
      string memory tokenURI_,
      address _owner,
      address _trustedAddress,
      uint256 _maxSupply
    ) = abi.decode(
        _initializationData,
        (string, string, string, string, address, address, uint256)
      );

    _initialize(
      _name,
      _symbol,
      contractURI_,
      tokenURI_,
      _owner,
      _trustedAddress,
      _maxSupply
    );
  }

  /// @dev Initialize after deploying clone
  /// @param _name Token name
  /// @param _symbol Token symbol
  /// @param contractURI_ Token contract metadata URI
  /// @param tokenURI_ Token metadata URI
  /// @param _owner Owner of token contract
  /// @param _trustedAddress Address used for signatures
  /// @param _maxSupply Max allowed token amount
  function _initialize(
    string memory _name,
    string memory _symbol,
    string memory contractURI_,
    string memory tokenURI_,
    address _owner,
    address _trustedAddress,
    uint256 _maxSupply
  ) internal {
    assembly {
      // if (_trustedAddress == address(0))
      if iszero(_trustedAddress) {
        mstore(0x00, 0xe6c4247b) // revert InvalidAddress();
        revert(0x1c, 0x04)
      }
    }

    __EIP712_init(_name, "1.0");
    __ERC721_init(_name, _symbol);
    __EIP712MetaTransactionUpgradeable_init(_name, "1.0");

    nextTokenId = 1;
    _contractURI = contractURI_;
    _tokenURI = tokenURI_;
    owner = _owner;
    trustedAddress = _trustedAddress;
    maxSupply = _maxSupply;
  }

  /// @notice Public signature-based mint function
  /// @dev Verifies submitted signature to be from `trustedAddress`
  function mint(address to, bytes32 r, bytes32 s, uint8 v) external {
    if (claims[to] != 0) {
      assembly {
        mstore(0x00, 0x646cf558) // revert AlreadyClaimed();
        revert(0x1c, 0x04)
      }
    }

    uint256 tokenId = nextTokenId;

    bytes32 digest = _hashTypedDataV4(
      keccak256(abi.encode(_MINT_TYPEHASH, to))
    );
    if (ECDSAUpgradeable.recover(digest, v, r, s) != trustedAddress) {
      assembly {
        mstore(0x00, 0xe6c4247b) // revert InvalidAddress();
        revert(0x1c, 0x04)
      }
    }

    _mintToken(to, tokenId);
  }

  /// @notice Get contract-level metadata URI
  /// @return URI to fetch contract-level metadata
  function contractURI() public view returns (string memory) {
    return _contractURI;
  }

  /// @notice Return token media URI
  function tokenURI(
    uint256
  ) public view virtual override returns (string memory) {
    return _tokenURI;
  }

  /// @dev Internal mint function.
  ///      Reverts if exceeds max supply
  /// @param to Destination address
  /// @param tokenId Token Id
  function _mintToken(address to, uint256 tokenId) internal {
    if (tokenId > maxSupply) {
      assembly {
        mstore(0x00, 0xc30436e9) // revert ExceedsMaxSupply();
        revert(0x1c, 0x04)
      }
    }

    claims[to] = tokenId;

    unchecked {
      ++nextTokenId;
    }

    _safeMint(to, tokenId);
  }
}
