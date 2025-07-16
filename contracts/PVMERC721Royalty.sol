// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ERC721} from "./token/ERC721/ERC721.sol";
import {ERC721Royalty} from "./token/ERC721/extensions/ERC721Royalty.sol";
import {Ownable} from "./access/Ownable.sol";

contract PVMERC721Royalty is ERC721Royalty, Ownable {
    uint256 private _currentTokenId;

    constructor(
        string memory name_,
        string memory symbol_
    ) ERC721(name_, symbol_) Ownable(msg.sender) {
        _currentTokenId = 1;
    }

    function safeMint(address to) public onlyOwner {
        require(to != address(0), "Cannot mint to zero address");
        _safeMint(to, _currentTokenId);
        _currentTokenId++;
    }

    function safeMintWithRoyalty(
        address to,
        address royaltyReceiver,
        uint96 royaltyFeeBasisPoints
    ) public onlyOwner {
        require(to != address(0), "Cannot mint to zero address");
        require(
            royaltyReceiver != address(0),
            "Cannot set royalty receiver to zero address"
        );
        require(
            royaltyFeeBasisPoints <= 10000,
            "Royalty fee cannot exceed 100%"
        );

        uint256 tokenId = _currentTokenId;
        _safeMint(to, tokenId);
        _setTokenRoyalty(tokenId, royaltyReceiver, royaltyFeeBasisPoints);
        _currentTokenId++;
    }

    function setDefaultRoyalty(
        address receiver,
        uint96 feeNumerator
    ) public onlyOwner {
        require(
            receiver != address(0),
            "Cannot set royalty receiver to zero address"
        );
        require(feeNumerator <= 10000, "Royalty fee cannot exceed 100%");
        _setDefaultRoyalty(receiver, feeNumerator);
    }

    function setTokenRoyalty(
        uint256 tokenId,
        address receiver,
        uint96 feeNumerator
    ) public onlyOwner {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        require(
            receiver != address(0),
            "Cannot set royalty receiver to zero address"
        );
        require(feeNumerator <= 10000, "Royalty fee cannot exceed 100%");
        _setTokenRoyalty(tokenId, receiver, feeNumerator);
    }

    function resetTokenRoyalty(uint256 tokenId) public onlyOwner {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        _resetTokenRoyalty(tokenId);
    }

    function deleteDefaultRoyalty() public onlyOwner {
        _deleteDefaultRoyalty();
    }

    function nextTokenId() public view returns (uint256) {
        return _currentTokenId;
    }

    function totalSupply() public view returns (uint256) {
        return _currentTokenId - 1;
    }

    function supportsInterface(
        bytes4 interfaceId
    ) public view override(ERC721Royalty) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
