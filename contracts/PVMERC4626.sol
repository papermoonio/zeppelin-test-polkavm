// SPDX-License-Identifier: MIT

pragma solidity ^0.8.28;

import {ERC4626} from "./token/ERC20/extensions/ERC4626.sol";
import {IERC20} from "./token/ERC20/IERC20.sol";
import {ERC20} from "./token/ERC20/ERC20.sol";

contract PVMERC4626 is ERC4626 {
    constructor(
        IERC20 asset,
        string memory name,
        string memory symbol
    ) ERC20(name, symbol) ERC4626(asset) {}
}
