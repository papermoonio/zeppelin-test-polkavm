// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ERC721} from "./token/ERC721/ERC721.sol";
import {ERC721Consecutive} from "./token/ERC721/extensions/ERC721Consecutive.sol";
import {Ownable} from "./access/Ownable.sol";

contract PVMERC721Consecutive is ERC721Consecutive, Ownable {
    uint256 private _currentIndex;

    constructor(
        string memory name_,
        string memory symbol_
    ) ERC721(name_, symbol_) Ownable(msg.sender) {
        _currentIndex = 1; // Start token IDs from 1
    }

    /**
     * @dev Mint tokens consecutively to a single address
     * @param to The address to mint tokens to
     * @param quantity The number of tokens to mint
     */
    function mintConsecutive(address to, uint96 quantity) public onlyOwner {
        require(to != address(0), "Cannot mint to zero address");
        require(quantity > 0, "Quantity must be greater than 0");

        _mintConsecutive(to, quantity);
    }

    /**
     * @dev Mint a single token to an address
     * @param to The address to mint the token to
     */
    function mint(address to) public onlyOwner {
        require(to != address(0), "Cannot mint to zero address");

        _mint(to, _currentIndex);
        _currentIndex++;
    }

    /**
     * @dev Get the next token ID that will be minted
     */
    function nextTokenId() public view returns (uint256) {
        return _currentIndex;
    }

    /**
     * @dev Get the total number of tokens minted
     */
    function totalSupply() public view returns (uint256) {
        return _currentIndex - 1;
    }
}
