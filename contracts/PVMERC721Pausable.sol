// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ERC721} from "./token/ERC721/ERC721.sol";
import {ERC721Pausable} from "./token/ERC721/extensions/ERC721Pausable.sol";
import {Ownable} from "./access/Ownable.sol";

contract PVMERC721Pausable is ERC721Pausable, Ownable {
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

    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }

    function nextTokenId() public view returns (uint256) {
        return _currentTokenId;
    }

    function totalSupply() public view returns (uint256) {
        return _currentTokenId - 1;
    }

    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal override(ERC721Pausable) returns (address) {
        return super._update(to, tokenId, auth);
    }
}
