// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/metatx/ERC2771Context.sol";

/// @title ERC721 contract with signature-based minting
/// @dev Supports ERC2771 meta transactions
contract ERC721TokenGaslessMint is ERC721, EIP712, ERC2771Context {
  /// @notice Emitted when user tries to mint more than once
  error AlreadyClaimed();

  /// @notice Emitted when trying to set `trustedAddress` to zero address, or if signature verification fails during mint()
  error InvalidAddress();

  /// @notice Emitted when user tries to mint beyond maxSupply
  error ExceedsMaxSupply();

  /// @dev Counter for the next tokenID, defaults to 1 for better gas on first mint
  uint256 public nextTokenId = 1;

  /// @notice Token contractURI
  string internal _contractURI;

  /// @notice Token URI
  string internal _tokenURI;

  /// @notice Max allowed token amount
  uint256 public immutable maxSupply;

  /// @notice The owner of this contract (set to the deployer)
  address public immutable owner;

  /// @dev Address used for signatures
  address internal immutable trustedAddress;

  /// @notice Check if NFT has been claimed before
  mapping(address => uint256) public claims;

  bytes32 private constant _MINT_TYPEHASH = keccak256("Mint(address to)");

  /// @param _name Token name
  /// @param _symbol Token symbol
  /// @param contractURI_ Token contract metadata URI
  /// @param tokenURI_ Token metadata URI
  /// @param _trustedAddress Address used for signatures
  /// @param _maxSupply Max allowed token amount
  constructor(
    string memory _name,
    string memory _symbol,
    string memory contractURI_,
    string memory tokenURI_,
    address _trustedAddress,
    uint256 _maxSupply,
    address _trustedForwarder
  )
    EIP712(_name, "1.0")
    ERC721(_name, _symbol)
    ERC2771Context(_trustedForwarder)
  {
    /* if (_trustedAddress == address(0)) revert InvalidAddress(); */

    assembly {
      if iszero(_trustedAddress) {
        mstore(0x00, 0xe6c4247b) // InvalidAddress()
        revert(0x1c, 0x04)
      }
    }

    owner = _msgSender();
    _contractURI = contractURI_;
    _tokenURI = tokenURI_;
    trustedAddress = _trustedAddress;
    maxSupply = _maxSupply;
  }

  /// @notice Public signature-based mint function
  /// @dev Verifies submitted signature to be from `trustedAddress`
  function mint(address to, bytes32 r, bytes32 s, uint8 v) external {
    if (claims[_msgSender()] != 0) {
      /* revert AlreadyClaimed(); */
      assembly {
        mstore(0x00, 0x646cf558) // AlreadyClaimed()
        revert(0x1c, 0x04)
      }
    }

    uint256 tokenId = nextTokenId;

    bytes32 digest = _hashTypedDataV4(
      keccak256(abi.encode(_MINT_TYPEHASH, _msgSender()))
    );
    if (ECDSA.recover(digest, v, r, s) != trustedAddress) {
      /* revert InvalidAddress(); */
      assembly {
        mstore(0x00, 0xe6c4247b) // InvalidAddress()
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
      /* revert ExceedsMaxSupply(); */
      assembly {
        mstore(0x00, 0xc30436e9) // ExceedsMaxSupply()
        revert(0x1c, 0x04)
      }
    }

    claims[_msgSender()] = tokenId;

    unchecked {
      ++nextTokenId;
    }

    _safeMint(to, tokenId);
  }

  // The functions below are overrides required by Solidity.

  function _msgSender()
    internal
    view
    virtual
    override(Context, ERC2771Context)
    returns (address sender)
  {
    return ERC2771Context._msgSender();
  }

  function _msgData()
    internal
    view
    virtual
    override(Context, ERC2771Context)
    returns (bytes calldata)
  {
    return ERC2771Context._msgData();
  }
}
