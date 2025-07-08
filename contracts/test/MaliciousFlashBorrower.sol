// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IERC3156FlashBorrower} from "../interfaces/IERC3156FlashBorrower.sol";

contract MaliciousFlashBorrower is IERC3156FlashBorrower {
    function onFlashLoan(
        address initiator,
        address token,
        uint256 amount,
        uint256 fee,
        bytes calldata data
    ) external override returns (bytes32) {
        // Maliciously don't return the tokens
        return keccak256("ERC3156FlashBorrower.onFlashLoan");
    }
}
