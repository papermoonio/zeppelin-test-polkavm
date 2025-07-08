// SPDX-License-Identifier: MIT

pragma solidity ^0.8.28;

import {IERC3156FlashBorrower} from "./interfaces/IERC3156FlashBorrower.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Address} from "@openzeppelin/contracts/utils/Address.sol";

contract PVMERC3156FlashBorrower is IERC3156FlashBorrower {
    bytes32 public constant RETURN_VALUE =
        keccak256("ERC3156FlashBorrower.onFlashLoan");

    event BalanceOf(address token, address account, uint256 value);
    event TotalSupply(address token, uint256 value);

    constructor() {}

    function onFlashLoan(
        address /*initiator*/,
        address token,
        uint256 amount,
        uint256 fee,
        bytes calldata data
    ) public returns (bytes32) {
        // require(msg.sender == token);

        // emit BalanceOf(
        //     token,
        //     address(this),
        //     IERC20(token).balanceOf(address(this))
        // );
        // emit TotalSupply(token, IERC20(token).totalSupply());

        // if (data.length > 0) {
        //     // WARNING: This code is for testing purposes only! Do not use.
        //     Address.functionCall(token, data);
        // }

        IERC20(token).approve(token, amount + fee);

        return RETURN_VALUE;
    }
}
