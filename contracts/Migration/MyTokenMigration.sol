// SPDX-License-Identifier: Unlicinse
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {MyTokenV2} from "./MyTokenV2.sol";

//owner rework
contract MyTokenMigration {
    ERC20 public immutable oldContractAddress;
    MyTokenV2 public immutable newContractAddress;

    error InsufficientBalance();
    error NotInAllowanceBalance();

    constructor(ERC20 _oldContractAddress) {
        oldContractAddress = _oldContractAddress;
        newContractAddress = new MyTokenV2();
    }

    function migrate() public {
        uint amount = oldContractAddress.balanceOf(msg.sender);

        if (amount == 0) {
            revert InsufficientBalance();
        }
        if (oldContractAddress.allowance(msg.sender, address(this)) < amount) {
            revert NotInAllowanceBalance();
        }

        oldContractAddress.transferFrom(msg.sender, address(this), amount);

        //assume converting to 1:2
        newContractAddress.mint(msg.sender, amount * 2);
    }
}
