// SPDX-License-Identifier: MIT

pragma solidity ^0.8.28;

import {ERC20Wrapper} from "./token/ERC20/extensions/ERC20Wrapper.sol";
import {IERC20} from "./token/ERC20/IERC20.sol";
import {ERC20} from "./token/ERC20/ERC20.sol";

contract PVMERC20Wrapper is ERC20Wrapper {
    constructor(
        IERC20 underlyingToken,
        string memory name,
        string memory symbol
    ) ERC20Wrapper(underlyingToken) ERC20(name, symbol) {}

    /**
     * @dev Allow a user to deposit underlying tokens and mint the corresponding number of wrapped tokens.
     */
    function depositFor(
        address account,
        uint256 value
    ) public override returns (bool) {
        return super.depositFor(account, value);
    }

    /**
     * @dev Allow a user to burn a number of wrapped tokens and withdraw the corresponding number of underlying tokens.
     */
    function withdrawTo(
        address account,
        uint256 value
    ) public override returns (bool) {
        return super.withdrawTo(account, value);
    }
}
