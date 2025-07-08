// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IERC20} from "../interfaces/IERC20.sol";
import {IERC3156FlashBorrower} from "../interfaces/IERC3156FlashBorrower.sol";

contract ArbitrageFlashBorrower is IERC3156FlashBorrower {
    function onFlashLoan(
        address initiator,
        address token,
        uint256 amount,
        uint256 fee,
        bytes calldata data
    ) external override returns (bytes32) {
        // Simulate arbitrage logic (in reality would do some trading)
        // For this test, just return the borrowed amount + fee
        IERC20(token).transfer(msg.sender, amount + fee);
        return keccak256("ERC3156FlashBorrower.onFlashLoan");
    }
}
