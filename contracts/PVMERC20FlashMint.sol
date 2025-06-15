// SPDX-License-Identifier: MIT

pragma solidity ^0.8.28;

import {ERC20} from "./token/ERC20/ERC20.sol";
import {ERC20FlashMint} from "./token/ERC20/extensions/ERC20FlashMint.sol";

contract PVMERC20FlashMint is ERC20FlashMint {
    constructor(
        string memory name,
        string memory symbol,
        uint256 totalSupply
    ) ERC20(name, symbol) {
        _mint(_msgSender(), totalSupply);
    }
}
