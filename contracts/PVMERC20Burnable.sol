// SPDX-License-Identifier: MIT

pragma solidity ^0.8.28;

import {ERC20} from "./token/ERC20/ERC20.sol";
import {ERC20Burnable} from "./token/ERC20/extensions/ERC20Burnable.sol";

contract PVMERC20Burnable is ERC20Burnable {
    constructor(
        string memory name,
        string memory symbol,
        uint256 totalSupply
    ) ERC20(name, symbol) {
        _mint(_msgSender(), totalSupply);
    }
}
