// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "@openzeppelin/contracts-upgradeable/utils/cryptography/ECDSAUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/cryptography/EIP712Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "./interfaces/IERC721Token.sol";
import "../../../metatx-standard/EIP712MetaTransactionUpgradeable/EIP712MetaTransactionUpgradeable.sol";
import "../../../protocol-rewards/RewardsSplitter.sol";

/// @title Soulbound ERC721 contract with signature-based minting
contract ERC721SoulboundTokenImpl is
  IERC721Token,
  EIP712Upgradeable,
  ReentrancyGuardUpgradeable,
  EIP712MetaTransactionUpgradeable,
  RewardsSplitter
{
  /// @notice Emitted when calling any transfer related function
  error Soulbound();

  /// @notice Emitted when user tries to mint more than once
  error AlreadyClaimed();

  /// @notice Emitted when user tries to mint beyond maxSupply
  error ExceedsMaxSupply();

  /// @notice Emitted when `msg.value` does not equal to `MINT_FEE` during `mint()`
  error InvalidFee();

  /// @notice Emitted when ether transfer reverted
  error TransferFailed();

  /// @notice Emitted when mint fee is paid during mint
  /// @param mintFee mint fee paid
  /// @param mintFeePayer token minter who paid mintFee
  /// @param mintFeeRecipient mint fee recipient
  /// @param owner owner of campaign
  /// @param referrer referrer of token minter
  event MintFeePaid(
    uint256 mintFee,
    address mintFeePayer,
    address mintFeeRecipient,
    address owner,
    address referrer
  );

  /// @notice Emitted when sponsored mint fees are paid during initialization
  /// @param sponsoredMints number of sponsored mints
  /// @param mintFee mint fee paid
  /// @param mintFeeRecipient mint fee recipient
  event SponsoredMintFeesPaid(
    uint256 sponsoredMints,
    uint256 mintFee,
    address mintFeeRecipient
  );

  /// @dev Emits when ownership changes. Used only during mint since soulbound
  event Transfer(address indexed from, address indexed to, uint256 indexed id);

  /// @notice Mint Fee
  uint256 public immutable MINT_FEE;

  /// @notice Sponsored Mint Fee
  uint256 public immutable SPONSORED_MINT_FEE;

  /// @notice Mint Fee Recipient
  address payable public immutable MINT_FEE_RECIPIENT;

  /// @dev Counter for the next tokenID, defaults to 1 for better gas on first mint
  uint256 public nextTokenId;

  /// @notice Token name
  string public name;

  /// @notice Token symbol
  string public symbol;

  /// @notice Token contractURI
  string internal _contractURI;

  /// @notice Token URI
  string internal _tokenURI;

  /// @notice Max allowed token amount
  uint256 public maxSupply;

  /// @notice No. of sponsored mints currently used
  uint256 public sponsoredMints;

  /// @notice Max allowed sponsored mints
  uint256 public maxSponsoredMints;

  /// @notice Get the owner of a certain tokenID
  mapping(uint256 => address) public ownerOf;

  /// @notice Get how many tokens a certain user owns
  mapping(address => uint256) public balanceOf;

  /// @notice The owner of this contract (set to the deployer)
  address public owner;

  /// @dev Address used for signatures
  address internal trustedAddress;

  /// @notice Check if NFT has been claimed before
  mapping(address => uint256) public claims;

  bytes32 private constant _MINT_TYPEHASH = keccak256("Mint(address to)");

  constructor(
    uint256 _mintFee,
    uint256 _sponsoredMintFee,
    address payable _mintFeeRecipient,
    address _protocolRewards
  ) RewardsSplitter(_protocolRewards) {
    _disableInitializers();

    MINT_FEE = _mintFee;
    SPONSORED_MINT_FEE = _sponsoredMintFee;
    MINT_FEE_RECIPIENT = _mintFeeRecipient;
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
      uint256 _maxSupply,
      uint256 _maxSponsoredMints
    ) = abi.decode(
        _initializationData,
        (string, string, string, string, address, address, uint256, uint256)
      );

    _initialize(
      _name,
      _symbol,
      contractURI_,
      tokenURI_,
      _owner,
      _trustedAddress,
      _maxSupply,
      _maxSponsoredMints
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
  /// @param _maxSponsoredMints Max allowed sponsored mints
  function _initialize(
    string memory _name,
    string memory _symbol,
    string memory contractURI_,
    string memory tokenURI_,
    address _owner,
    address _trustedAddress,
    uint256 _maxSupply,
    uint256 _maxSponsoredMints
  ) internal {
    assembly {
      // if (_trustedAddress == address(0))
      if iszero(_trustedAddress) {
        mstore(0x00, 0xe6c4247b) // revert InvalidAddress();
        revert(0x1c, 0x04)
      }
    }

    __EIP712_init(_name, "1.0");
    __EIP712MetaTransactionUpgradeable_init(_name, "1.0");

    nextTokenId = 1;
    name = _name;
    symbol = _symbol;
    _contractURI = contractURI_;
    _tokenURI = tokenURI_;
    owner = _owner;
    trustedAddress = _trustedAddress;
    maxSupply = _maxSupply;
    maxSponsoredMints = _maxSponsoredMints;

    if (_maxSponsoredMints > 0) {
      if (_maxSponsoredMints > _maxSupply) {
        assembly {
          mstore(0x00, 0xc30436e9) // revert ExceedsMaxSupply();
          revert(0x1c, 0x04)
        }
      }
      _paySponsoredMintFees(_maxSponsoredMints);
    }
  }

  /// @notice Public signature-based mint function
  /// @dev Verifies submitted signature to be from `trustedAddress`
  function mint(
    address to,
    bytes32 r,
    bytes32 s,
    uint8 v,
    address _referrer
  ) public payable nonReentrant {
    assembly {
      // if (to == _referrer)
      if eq(shr(96, shl(96, to)), shr(96, shl(96, _referrer))) {
        mstore(0x00, 0xe6c4247b) // revert InvalidAddress();
        revert(0x1c, 0x04)
      }
    }

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

    if (sponsoredMints >= maxSponsoredMints) {
      if (msg.value != MINT_FEE) {
        assembly {
          mstore(0x00, 0x58d620b3) // revert InvalidFee();
          revert(0x1c, 0x04)
        }
      }

      _payMintFee(_referrer);
    } else {
      if (msg.value != 0) {
        assembly {
          mstore(0x00, 0x58d620b3) // revert InvalidFee();
          revert(0x1c, 0x04)
        }
      }
      sponsoredMints++;
    }
  }

  /// @notice Increase no. of sponsored mints
  /// @dev Reverts if exceeds max supply
  /// @param _additionalSponsoredMints Number to increase current sponsored mints by
  function increaseMaxSponsoredMints(
    uint256 _additionalSponsoredMints
  ) external payable nonReentrant {
    uint256 newSponsoredMints = maxSponsoredMints + _additionalSponsoredMints;
    if (newSponsoredMints > maxSupply) {
      assembly {
        mstore(0x00, 0xc30436e9) // revert ExceedsMaxSupply();
        revert(0x1c, 0x04)
      }
    }

    maxSponsoredMints = newSponsoredMints;

    _paySponsoredMintFees(_additionalSponsoredMints);
  }

  /// @notice Get contract-level metadata URI
  /// @return URI to fetch contract-level metadata
  function contractURI() public view returns (string memory) {
    return _contractURI;
  }

  /// @notice Return token media URI
  function tokenURI(uint256) public view virtual returns (string memory) {
    return _tokenURI;
  }

  /// @notice Disabled ERC721 "approve" method
  function approve(address, uint256) public virtual {
    assembly {
      mstore(0x00, 0xa4420a95) // revert Soulbound();
      revert(0x1c, 0x04)
    }
  }

  /// @notice Disabled ERC721 "isApprovedForAll" method
  function isApprovedForAll(address, address) public view virtual {
    assembly {
      mstore(0x00, 0xa4420a95) // revert Soulbound();
      revert(0x1c, 0x04)
    }
  }

  /// @notice Disabled ERC721 "getApproved" method
  function getApproved(uint256) public view virtual {
    assembly {
      mstore(0x00, 0xa4420a95) // revert Soulbound();
      revert(0x1c, 0x04)
    }
  }

  /// @notice Disabled ERC721 "getApproved" method
  function setApprovalForAll(address, bool) public virtual {
    assembly {
      mstore(0x00, 0xa4420a95) // revert Soulbound();
      revert(0x1c, 0x04)
    }
  }

  /// @notice Disabled ERC721 "transferFrom" method
  function transferFrom(address, address, uint256) public virtual {
    assembly {
      mstore(0x00, 0xa4420a95) // revert Soulbound();
      revert(0x1c, 0x04)
    }
  }

  /// @notice Disabled ERC721 "safeTransferFrom" method
  function safeTransferFrom(address, address, uint256) public virtual {
    assembly {
      mstore(0x00, 0xa4420a95) // revert Soulbound();
      revert(0x1c, 0x04)
    }
  }

  /// @notice Disabled ERC721 "safeTransferFrom" method
  function safeTransferFrom(
    address,
    address,
    uint256,
    bytes calldata
  ) public virtual {
    assembly {
      mstore(0x00, 0xa4420a95) // revert Soulbound();
      revert(0x1c, 0x04)
    }
  }

  /// @dev Query if a contract implements an interface
  /// @param interfaceId The interface identifier, as specified in ERC-165
  function supportsInterface(
    bytes4 interfaceId
  ) public view virtual returns (bool) {
    bool result;
    assembly {
      let _interfaceId := shr(224, interfaceId)
      result := or(
        or(eq(_interfaceId, 0x01ffc9a7), eq(_interfaceId, 0x80ac58cd)), // ERC165, ERC721
        eq(_interfaceId, 0x5b5e139f) // ERC721Metadata
      )
    }
    return result;
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

    unchecked {
      ++balanceOf[to];
      ++nextTokenId;
    }

    ownerOf[tokenId] = to;
    claims[to] = tokenId;

    assembly {
      log4(
        0x00,
        0x00, // no data
        0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef, // Transfer(address,address,uint256)
        0, // from
        to, // to
        tokenId // id
      )
    }
  }

  /// @dev Internal function to pay mint fee
  ///      Splits and deposits into protocol rewards
  ///      Emits MintFeePaid
  function _payMintFee(address _referrer) internal {
    splitAndDepositRewards(
      MINT_FEE,
      MINT_FEE_RECIPIENT, // platform
      owner, // creator
      _referrer // referrer
    );

    emit MintFeePaid(
      MINT_FEE,
      msgSender(),
      MINT_FEE_RECIPIENT,
      owner,
      _referrer
    );
  }

  /// @dev Internal function to pay sponsored mint fees
  ///      Reverts if ether transfer fails
  ///      Emits SponsoredMintFeesPaid
  function _paySponsoredMintFees(uint256 _sponsoredMints) internal {
    uint256 totalSponsoredMintFees = _sponsoredMints * SPONSORED_MINT_FEE;
    if (msg.value != totalSponsoredMintFees) {
      assembly {
        mstore(0x00, 0x58d620b3) // revert InvalidFee();
        revert(0x1c, 0x04)
      }
    }

    _transferFunds(MINT_FEE_RECIPIENT, totalSponsoredMintFees);

    emit SponsoredMintFeesPaid(
      _sponsoredMints,
      SPONSORED_MINT_FEE,
      MINT_FEE_RECIPIENT
    );
  }

  /// @dev Internal function to transfer funds
  ///      Reverts if ether transfer fails
  function _transferFunds(address payable _to, uint256 _amount) internal {
    (bool success, ) = _to.call{value: _amount}("");
    assembly {
      // if (!success)
      if iszero(success) {
        mstore(0x00, 0x90b8ec18) // revert TransferFailed();
        revert(0x1c, 0x04)
      }
    }
  }
}
