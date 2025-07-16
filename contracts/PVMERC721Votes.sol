// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ERC721} from "./token/ERC721/ERC721.sol";
import {ERC721Votes} from "./token/ERC721/extensions/ERC721Votes.sol";
import {Ownable} from "./access/Ownable.sol";
import {EIP712} from "./utils/cryptography/EIP712.sol";

contract PVMERC721Votes is ERC721Votes, Ownable {
    uint256 private _currentTokenId;

    constructor(
        string memory name_,
        string memory symbol_,
        string memory version_
    ) ERC721(name_, symbol_) EIP712(name_, version_) Ownable(msg.sender) {
        _currentTokenId = 1;
    }

    function safeMint(address to) public onlyOwner {
        require(to != address(0), "Cannot mint to zero address");
        _safeMint(to, _currentTokenId);
        _currentTokenId++;
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

    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal override(ERC721Votes) returns (address) {
        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(
        address account,
        uint128 value
    ) internal override(ERC721Votes) {
        super._increaseBalance(account, value);
    }
}
