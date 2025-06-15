// SPDX-License-Identifier: MIT

pragma solidity ^0.8.28;

import {ERC20} from "./token/ERC20/ERC20.sol";
import {ERC20Pausable} from "./token/ERC20/extensions/ERC20Pausable.sol";

contract PVMERC20Pausable is ERC20Pausable {
    constructor(
        string memory name,
        string memory symbol,
        uint256 totalSupply
    ) ERC20(name, symbol) {
        _mint(_msgSender(), totalSupply);
    }

    function pause() external {
        _pause();
    }

    function unpause() external {
        _unpause();
    }

    function transfer(
        address to,
        uint256 amount
    ) public virtual override whenNotPaused returns (bool) {
        return super.transfer(to, amount);
    }

    function transferFrom(
        address from,
        address to,
        uint256 amount
    ) public virtual override whenNotPaused returns (bool) {
        return super.transferFrom(from, to, amount);
    }

    function approve(
        address spender,
        uint256 amount
    ) public virtual override whenNotPaused returns (bool) {
        return super.approve(spender, amount);
    }
}
