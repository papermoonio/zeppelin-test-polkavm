// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ERC721} from "./token/ERC721/ERC721.sol";
import {ERC721Burnable} from "./token/ERC721/extensions/ERC721Burnable.sol";
import {Ownable} from "./access/Ownable.sol";

contract PVMERC721Burnable is ERC721Burnable, Ownable {
    constructor(
        string memory name_,
        string memory symbol_
    ) ERC721Burnable() ERC721(name_, symbol_) Ownable(msg.sender) {}

    function safeMint(address to, uint256 tokenId) public onlyOwner {
        _safeMint(to, tokenId);
    }
}
