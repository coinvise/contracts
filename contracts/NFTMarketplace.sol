// SPDX-License-Identifier: Unlicensed
pragma solidity 0.7.4;
pragma experimental ABIEncoderV2;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/Initializable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {SafeMath} from "@openzeppelin/contracts/math/SafeMath.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import {EnumerableSet} from "@openzeppelin/contracts/utils/EnumerableSet.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import {EIP712MetaTransactionUpgradeable} from "./lib/EIP712MetaTransactionUpgradeable/EIP712MetaTransactionUpgradeable.sol";
import "hardhat/console.sol";

// Due to restrictions of the proxy pattern, do not change the following order
// of Inheritance
contract NFTMarketplace is
    Initializable,
    OwnableUpgradeable,
    EIP712MetaTransactionUpgradeable,
    ReentrancyGuardUpgradeable
{
    using EnumerableSet for EnumerableSet.UintSet;
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    event NftListed(
        uint256 listingId,
        address nftTokenAddress,
        uint256 nftTokenId,
        address listedBy,
        uint256 paymentType,
        uint256 paymentAmount,
        address paymentTokenAddress
    );

    event NftDelisted(uint256 listingId);

    event NftListingLiked(address indexed likedBy, uint256 nftListingId);

    event NftListingLikeReverted(address indexed likedBy, uint256 nftListingId);

    event NftBought(address indexed buyer, uint256 nftListingId);

    event WithdrawnEthPremiums(address indexed recipient, uint256 amount);

    event WithdrawnErc20Premiums(
        address indexed recipient,
        IERC20 erc20Token,
        uint256 amount
    );

    // TODO: SWITCH TO ENUMS
    struct NftListing {
        uint256 listingId;
        address nftTokenAddress;
        uint256 nftTokenId;
        address payable listedBy;
        uint256 paymentType; // 0-ETH, 1-ERC20
        uint256 paymentAmount;
        address paymentTokenAddress;
    }

    /**
     * @dev Following are the state variables for this contract
     *      Due to resrictions of the proxy pattern, do not change the type or order
     *      of the state variables.
     *      https://docs.openzeppelin.com/upgrades-plugins/1.x/writing-upgradeable
     */
    // Listing State
    uint256 _nextNftListingId;
    EnumerableSet.UintSet _listedNftTokenIds;
    mapping(uint256 => NftListing) public nftListingById;

    // Likes State: user => NftListingId => bool
    mapping(address => mapping(uint256 => bool)) public hasUserLikedNftListing;

    // Coinvise premium. If premium rate is 0.2%, is would be stored as 0.2 * 10^decimals = 20
    uint256 public premiumPercentage;
    uint256 public premiumPercentageDecimals;
    uint256 public nftListingFee;

    // Whitelisted ERC20 Tokens
    mapping(address => bool) public isPaymentTokenWhiteListed;
    bool isPaymentTokenWhiteListActive;

    // Pausibility
    bool public isPaused;

    // Add any new state variables here

    // End of state variables

    /**
     * @dev We cannot have constructors in upgradeable contracts,
     *      therefore we define an initialize function which we call
     *      manually once the contract is deployed.
     *      the initializer modififer ensures that this can only be called once.
     *      in practice, the openzeppelin library automatically calls the intitazie
     *      function once deployed.
     */
    function initialize(
        uint256 _premiumPercentage,
        uint256 _premiumPercentageDecimals,
        uint256 _nftListingFee,
        address[] memory whiteListedTokens
    ) public initializer {
        // Call intialize of Base Contracts
        OwnableUpgradeable.__Ownable_init();
        EIP712MetaTransactionUpgradeable._initialize(
            "CoinviseNftMarketplace",
            "1"
        );

        premiumPercentage = _premiumPercentage;
        premiumPercentageDecimals = _premiumPercentageDecimals;
        nftListingFee = _nftListingFee;
        isPaused = false;
        _nextNftListingId = 1;
        isPaymentTokenWhiteListActive = true;

        for (uint256 i = 0; i < whiteListedTokens.length; ++i) {
            isPaymentTokenWhiteListed[whiteListedTokens[i]] = true;
        }
    }

    // Pausibilty
    modifier pausable {
        require(!isPaused, "MARKETPLACE_PAUSED");
        _;
    }

    modifier onlyOwnerMeta {
        address _sender = msgSender();
        require(_sender == owner(), "UNAUTHORIZED");
        _;
    }

    function pauseMarketplace() external onlyOwnerMeta {
        isPaused = true;
    }

    function resumeMarketplace() external onlyOwnerMeta {
        isPaused = false;
    }

    // Whitelisting Tokens
    function setIsWhiteListActive(bool _isPaymentTokenWhiteListActive)
        external
        onlyOwnerMeta
    {
        isPaymentTokenWhiteListActive = _isPaymentTokenWhiteListActive;
    }

    function whiteListTokens(address[] memory tokens) external onlyOwnerMeta {
        for (uint256 i = 0; i < tokens.length; ++i) {
            isPaymentTokenWhiteListed[tokens[i]] = true;
        }
    }

    function blackListTokens(address[] memory tokens) external onlyOwnerMeta {
        for (uint256 i = 0; i < tokens.length; ++i) {
            isPaymentTokenWhiteListed[tokens[i]] = false;
        }
    }

    function setPremiumPercentage(
        uint256 _premiumPercentage,
        uint256 _premiumPercentageDecimals
    ) external onlyOwnerMeta {
        premiumPercentage = _premiumPercentage;
        premiumPercentageDecimals = _premiumPercentageDecimals;
    }

    /**
     *  @dev calculates cut given an amount
     */
    function _calculateCut(uint256 amount) internal view returns (uint256) {
        return
            amount.mul(premiumPercentage).div(
                (10**(premiumPercentageDecimals.add(2)))
            );
    }

    /**
     * @dev Returns the next id to be used for a new listing
     */
    function _getNextNftListingId() internal returns (uint256) {
        uint256 listingId = _nextNftListingId;
        _nextNftListingId = _nextNftListingId.add(1);
        return listingId;
    }

    /**
     * @dev returns an array of IDs of all the listings currently active on the market
     */
    function getCurrentNftListingIds()
        external
        view
        returns (uint256[] memory)
    {
        uint256 length = _listedNftTokenIds.length();
        uint256[] memory ids = new uint256[](length);
        for (uint256 i = 0; i < length; ++i) {
            ids[i] = _listedNftTokenIds.at(i);
        }
        return ids;
    }

    function getCurrentNftListingCount() external view returns (uint256) {
        return _listedNftTokenIds.length();
    }

    /**
     * @dev Creates a NFT listing.
     *      checks if nft has been approved to transfer by the owner for this contract
     */
    function listNftInEth(
        address _nftTokenAddress,
        uint256 _nftTokenId,
        uint256 _priceInWei
    ) external payable nonReentrant pausable {
        address payable _sender = payable(msgSender());

        // Check if NFT is approved
        IERC721 nftContract = IERC721(_nftTokenAddress);
        require(
            nftContract.getApproved(_nftTokenId) == address(this),
            "NFT_NOT_APPROVED"
        );

        require(_priceInWei > 0, "ERR__A_PRICE_MUST_BE_PROVIDED");
        require(msg.value == nftListingFee, "ERR__LISTING_FEE_MUST_BE_PAID");

        // Create a listing
        NftListing memory nftListing = NftListing(
            _getNextNftListingId(),
            _nftTokenAddress,
            _nftTokenId,
            _sender,
            0,
            _priceInWei,
            address(0)
        );
        _listedNftTokenIds.add(nftListing.listingId);
        nftListingById[nftListing.listingId] = nftListing;

        emit NftListed(
            nftListing.listingId,
            nftListing.nftTokenAddress,
            nftListing.nftTokenId,
            nftListing.listedBy,
            nftListing.paymentType,
            nftListing.paymentAmount,
            nftListing.paymentTokenAddress
        );
    }

    /**
     * @dev Creates a NFT listing, payable in an ERC20 Token.
     *      checks if nft has been approved to transfer by the owner for this contract
     */
    function listNftInErc20(
        address _nftTokenAddress,
        uint256 _nftTokenId,
        address _erc20TokenAddress,
        uint256 _priceInErc20Token
    ) external nonReentrant pausable {
        address payable _sender = payable(msgSender());

        if (isPaymentTokenWhiteListActive) {
            require(
                isPaymentTokenWhiteListed[_erc20TokenAddress],
                "ERC20_PAYMENT_TOKEN_NOT_WHITELISTED"
            );
        }
        // Check if NFT is approved
        IERC721 nftContract = IERC721(_nftTokenAddress);
        require(
            nftContract.getApproved(_nftTokenId) == address(this),
            "NFT_NOT_APPROVED"
        );

        require(_priceInErc20Token > 0, "ERR__A_PRICE_MUST_BE_PROVIDED");

        // Create a listing
        NftListing memory nftListing = NftListing(
            _getNextNftListingId(),
            _nftTokenAddress,
            _nftTokenId,
            _sender,
            1,
            _priceInErc20Token,
            _erc20TokenAddress
        );
        _listedNftTokenIds.add(nftListing.listingId);
        nftListingById[nftListing.listingId] = nftListing;

        emit NftListed(
            nftListing.listingId,
            nftListing.nftTokenAddress,
            nftListing.nftTokenId,
            nftListing.listedBy,
            nftListing.paymentType,
            nftListing.paymentAmount,
            nftListing.paymentTokenAddress
        );
    }

    /**
     * @dev Function for delisting a NFT from marketplace. Can be called if creator wants
     *      to manually removbe the listing, or once the NFT has been bought
     */
    function _unlistNft(uint256 _nftListingId) internal {
        _listedNftTokenIds.remove(_nftListingId);
        delete nftListingById[_nftListingId];
        emit NftDelisted(_nftListingId);
    }

    /**
     * @dev Called by listing creator, to delist a NFT before it's bought by someone
     */
    function unlistNftByListingCreator(uint256 _nftListingId)
        external
        pausable
    {
        address _sender = msgSender();

        require(
            _sender == nftListingById[_nftListingId].listedBy,
            "UNAUTHORIZED"
        );
        require(_listedNftTokenIds.contains(_nftListingId), "ALREADY_DELISTED");

        _unlistNft(_nftListingId);
    }

    /**
     *  @dev Transfers an NFT from lister to buyer if conditions are met
     */
    function buyNftInEth(uint256 _nftListingId) external payable pausable {
        address _sender = msgSender();

        NftListing memory nftListing = nftListingById[_nftListingId];

        // Lister cannot be buyer
        require(nftListing.listedBy != _sender, "BUYER_CANNOT_BE_LISTER");

        // Validate the listing
        require(_listedNftTokenIds.contains(_nftListingId), "ALREADY_DELISTED");
        require(nftListing.paymentType == 0, "WRONG_PAYMENT_TYPE");

        // Validate amount sent
        uint256 listingAmountWei = nftListing.paymentAmount;
        uint256 expectedAmountWei = listingAmountWei.add(
            _calculateCut(listingAmountWei)
        );
        require(msg.value == expectedAmountWei, "INVALID_FUNDS_SENT");

        // Check if NFT is approved
        IERC721 nftContract = IERC721(nftListing.nftTokenAddress);
        require(
            nftContract.getApproved(nftListing.nftTokenId) == address(this),
            "NFT_NOT_APPROVED"
        );

        // Transfer ETH to lister
        nftListing.listedBy.transfer(listingAmountWei);

        // Transfer NFT from lister to buyer
        nftContract.safeTransferFrom(
            nftListing.listedBy,
            _sender,
            nftListing.nftTokenId
        );

        // Close the listing
        _unlistNft(_nftListingId);

        // Emit
        emit NftBought(_sender, _nftListingId);
    }

    /**
     * @dev Transfers an NFT Token on payment by ERC20
     */
    function buyNftInErc20Tokens(uint256 _nftListingId) external pausable {
        address _sender = msgSender();

        NftListing memory nftListing = nftListingById[_nftListingId];

        // Lister cannot be buyer
        require(nftListing.listedBy != _sender, "BUYER_CANNOT_BE_LISTER");

        // Validate the listing
        require(_listedNftTokenIds.contains(_nftListingId), "ALREADY_DELISTED");
        require(nftListing.paymentType == 1, "WRONG_PAYMENT_TYPE");

        // Validate token approved amount
        uint256 listingAmountInTokens = nftListing.paymentAmount;
        uint256 expectedAmountInTokens = listingAmountInTokens.add(
            _calculateCut(listingAmountInTokens)
        );
        IERC20 erc20Token = IERC20(nftListing.paymentTokenAddress);
        require(
            erc20Token.allowance(_sender, address(this)) >=
                expectedAmountInTokens,
            "INSUFFICIENT_TOKEN_ALLOWANCE"
        );

        // Check if NFT is approved
        IERC721 nftContract = IERC721(nftListing.nftTokenAddress);
        require(
            nftContract.getApproved(nftListing.nftTokenId) == address(this),
            "NFT_NOT_APPROVED"
        );

        // Transfer funds to marketContract;
        erc20Token.safeTransferFrom(
            _sender,
            address(this),
            expectedAmountInTokens
        );

        // Transfer asked price to lister
        erc20Token.safeTransfer(nftListing.listedBy, listingAmountInTokens);

        // Transfer NFT from lister to buyer
        nftContract.safeTransferFrom(
            nftListing.listedBy,
            _sender,
            nftListing.nftTokenId
        );
        // Close the listing
        _unlistNft(_nftListingId);

        // Emit
        emit NftBought(_sender, _nftListingId);
    }

    /**
     * @dev Increments the like counter for a listing if's it's actvie
     */
    function likeNftListing(uint256 _nftListingId) external pausable {
        address _sender = msgSender();

        require(_listedNftTokenIds.contains(_nftListingId), "ALREADY_DELISTED");
        require(
            !hasUserLikedNftListing[_sender][_nftListingId],
            "ALREADY_LIKED"
        );

        hasUserLikedNftListing[_sender][_nftListingId] = true;
        emit NftListingLiked(_sender, _nftListingId);
    }

    /**
     * @dev Decrements the like counter for a listing if's it's actvie
     */
    function undoLikeNftListing(uint256 _nftListingId) external pausable {
        address _sender = msgSender();

        require(_listedNftTokenIds.contains(_nftListingId), "ALREADY_DELISTED");
        require(hasUserLikedNftListing[_sender][_nftListingId], "NOT_LIKED");

        hasUserLikedNftListing[_sender][_nftListingId] = false;
        emit NftListingLikeReverted(_sender, _nftListingId);
    }

    /**
     * @dev Sends all eth to a specified address
     */
    function withdrawEthPremiums(address payable _to) external onlyOwnerMeta {
        _to.transfer(address(this).balance);
        emit WithdrawnEthPremiums(_to, address(this).balance);
    }

    /**
     * @dev Sends all balance of specific ERC20 token to address
     */
    function withdrawErc20Premiums(address _to, IERC20 erc20Token)
        external
        onlyOwnerMeta
    {
        uint256 balance = erc20Token.balanceOf(address(this));
        erc20Token.safeTransfer(_to, balance);
        emit WithdrawnErc20Premiums(_to, erc20Token, balance);
    }

    fallback() external payable {}

    receive() external payable {}
}
