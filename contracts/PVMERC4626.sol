// SPDX-License-Identifier: MIT

pragma solidity ^0.8.28;

import {ERC20} from "./token/ERC20/ERC20.sol";

contract PVMERC4626 is ERC20 {
    constructor(
        string memory name,
        string memory symbol,
        uint256 totalSupply
    ) ERC20(name, symbol) {
        _mint(_msgSender(), totalSupply);
    }
}
