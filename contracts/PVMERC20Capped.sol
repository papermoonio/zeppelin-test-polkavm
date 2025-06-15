// SPDX-License-Identifier: MIT

pragma solidity ^0.8.28;

import {ERC20} from "./token/ERC20/ERC20.sol";
import {ERC20Capped} from "./token/ERC20/extensions/ERC20Capped.sol";

contract PVMERC20Capped is ERC20Capped {
    constructor(
        string memory name,
        string memory symbol,
        uint256 cap
    ) ERC20Capped(cap) ERC20(name, symbol) {
        _mint(_msgSender(), cap);
    }
}
