// SPDX-License-Identifier: Unlicensed
pragma solidity 0.7.4;
pragma experimental ABIEncoderV2;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {EIP712MetaTransaction} from "../lib/EIP712MetaTransaction.sol";

/**
 * This is the "Coinvise collection" contract. Anyone is allowed to mint NFTs for the collection. 
 * Do not use this code for user-owned collections!
 + If/when we need to a user-owned collection, we must create a new contract with “onlyOwner” modifier in all "ownable" funcitons ("mint", "mintTo"....)
 */

contract ERC721Token is
    ERC721,
    Ownable,
    EIP712MetaTransaction("ERC721Token", "1")
{
    event TokenMinted(uint256 tokenId, address owner);
    event BulkTokensMinted(uint256 amount, address owner, uint256[] tokenIds);

    constructor(
        string memory _name,
        string memory _symbol,
        string memory _baseUri
    ) ERC721(_name, _symbol) {
        _setBaseURI(_baseUri);
    }

    function mintTo(string memory _tokenId, address _finalOwner)
        public
        returns (uint256)
    {
        bytes memory tempTokenId = bytes(_tokenId);
        require(tempTokenId.length > 0, "ERR__INVALID_TOKENID");

        uint256 tokenId = 1 + totalSupply();
        _safeMint(_finalOwner, tokenId);

        // Token Metadata url must be {baseUri}/{tokenId}
        string memory tokenUri = string(abi.encodePacked("/", _tokenId));
        _setTokenURI(tokenId, tokenUri);
        emit TokenMinted(tokenId, _finalOwner);
        return tokenId;
    }

    function mint(string memory _tokenId) public {
        bytes memory tempTokenId = bytes(_tokenId);
        require(tempTokenId.length > 0, "ERR__INVALID_TOKENID");

        mintTo(_tokenId, msgSender());
    }

    function bulkMintTo(
        uint256 _amount,
        string memory _tokenId,
        address _finalOwner
    ) public {
        uint256[] memory tokenIds = new uint256[](_amount);

        for (uint256 i = 0; i < _amount; i++) {
            tokenIds[i] = mintTo(_tokenId, msgSender());
        }

        emit BulkTokensMinted(_amount, _finalOwner, tokenIds);
    }

    function _msgSender()
        internal
        view
        virtual
        override
        returns (address payable)
    {
        return payable(msgSender());
    }
}
