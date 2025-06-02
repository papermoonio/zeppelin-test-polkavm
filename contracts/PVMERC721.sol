// SPDX-License-Identifier: MIT

pragma solidity ^0.8.19;

import {ERC721} from "./token/ERC721/ERC721.sol";
import {Ownable} from "./access/Ownable.sol";

contract PVMERC721 is ERC721, Ownable {
    uint256 private _nextTokenId;
    uint256 private _totalSupply;

    constructor(
        string memory name_,
        string memory symbol_
    ) ERC721(name_, symbol_) Ownable(msg.sender) {}

    function mint(address to, uint256 tokenId) public onlyOwner {
        require(to != address(0), "ERC721: mint to the zero address");
        require(!_exists(tokenId), "ERC721: token already minted");

        _safeMint(to, tokenId);
        _totalSupply++;
    }

    function totalSupply() public view returns (uint256) {
        return _totalSupply;
    }

    function burn(uint256 tokenId) public {
        require(
            ERC721.ownerOf(tokenId) == msg.sender ||
                ERC721.getApproved(tokenId) == msg.sender ||
                ERC721.isApprovedForAll(ERC721.ownerOf(tokenId), msg.sender),
            "ERC721: caller is not token owner or approved"
        );
        _burn(tokenId);
        _totalSupply--;
    }

    function _exists(uint256 tokenId) internal view returns (bool) {
        return _ownerOf(tokenId) != address(0);
    }
}
