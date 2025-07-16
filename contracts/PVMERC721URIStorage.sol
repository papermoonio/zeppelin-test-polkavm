// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ERC721} from "./token/ERC721/ERC721.sol";
import {ERC721URIStorage} from "./token/ERC721/extensions/ERC721URIStorage.sol";
import {Ownable} from "./access/Ownable.sol";

contract PVMERC721URIStorage is ERC721URIStorage, Ownable {
    uint256 private _currentTokenId;
    string private _baseTokenURI;

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

    function safeMintWithURI(address to, string memory uri) public onlyOwner {
        require(to != address(0), "Cannot mint to zero address");
        uint256 tokenId = _currentTokenId;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
        _currentTokenId++;
    }

    function setTokenURI(uint256 tokenId, string memory uri) public onlyOwner {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        _setTokenURI(tokenId, uri);
    }

    function setBaseURI(string memory baseURI) public onlyOwner {
        _baseTokenURI = baseURI;
    }

    function _baseURI() internal view virtual override returns (string memory) {
        return _baseTokenURI;
    }

    function nextTokenId() public view returns (uint256) {
        return _currentTokenId;
    }

    function totalSupply() public view returns (uint256) {
        return _currentTokenId - 1;
    }

    function exists(uint256 tokenId) public view returns (bool) {
        return _ownerOf(tokenId) != address(0);
    }

    function tokenURI(
        uint256 tokenId
    ) public view override(ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(
        bytes4 interfaceId
    ) public view override(ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
