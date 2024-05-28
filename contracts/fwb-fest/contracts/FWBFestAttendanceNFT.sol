pragma solidity >=0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "./metatx-standard/EIP712MetaTransaction.sol";

error AlreadyClaimed();
error InvalidAddress();

contract FWBFestAttendanceNFT is Ownable, ERC721, EIP712MetaTransaction {
    uint256 private _tokenId;

    address private immutable _trustedAddress;

    address private constant _campaignManager = 0x33d73cc0E060939476A10E47b86A4568c7DcF261;

    uint256 private constant _campaignId = 1;

    mapping(address => uint256) private _claims;

    event Claim(address indexed to, uint256 indexed tokenId);

    constructor(address trustedAddress)
        ERC721("FWB FEST ATTENDANCE NFT", "FWBFEST")
        EIP712MetaTransaction("FWBFest", "1.0.0")
    {
        _trustedAddress = trustedAddress;
    }

    function mint() external onlyOwner {
        ++_tokenId;
        _safeMint(msgSender(), _tokenId);
    }

    function claim(
        bytes32 r,
        bytes32 s,
        uint8 v
    ) external {
        address sender = msgSender();
        bytes32 messageHash = keccak256(
            abi.encodePacked(
                "\x19Ethereum Signed Message:\n32",
                keccak256(abi.encode(_campaignManager, _campaignId, sender))
            )
        );
        address signer = ecrecover(messageHash, v, r, s);

        if (signer != _trustedAddress) {
            revert InvalidAddress();
        }

        if (_claims[sender] != 0) {
            revert AlreadyClaimed();
        }

        _claim(sender);
    }

    function _claim(address sender) internal {
        ++_tokenId;
        _claims[sender] = _tokenId;
        _safeMint(sender, _tokenId);
        emit Claim(sender, _tokenId);
    }

    function isClaimed(address user) public view returns (bool) {
        return _claims[user] != 0;
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireMinted(tokenId);
        return "https://ipfs.io/ipfs/bafybeihuuwls3whxfshhldtgle2b2cpftubjmdosdn7tmws6lyqsxciiua/FWBFEST.json";
    }
}
