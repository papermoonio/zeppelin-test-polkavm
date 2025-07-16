// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ERC721} from "./token/ERC721/ERC721.sol";
import {ERC721Wrapper} from "./token/ERC721/extensions/ERC721Wrapper.sol";
import {IERC721} from "./interfaces/IERC721.sol";
import {Ownable} from "./access/Ownable.sol";

contract PVMERC721Wrapper is ERC721Wrapper, Ownable {
    constructor(
        IERC721 underlyingToken,
        string memory name_,
        string memory symbol_
    )
        ERC721(name_, symbol_)
        ERC721Wrapper(underlyingToken)
        Ownable(msg.sender)
    {}
}
