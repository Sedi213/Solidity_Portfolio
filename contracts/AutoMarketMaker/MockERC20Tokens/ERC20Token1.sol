// SPDX-License-Identifier: Unlicinse
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MyToken1 is ERC20 {
    address immutable owner;

    constructor() ERC20("MyToken1", "MT1") {
        owner = msg.sender;
    }

    function mint(address to, uint amount) public {
        require(owner == msg.sender, "You are not owner of contract");
        _mint(to, amount);
    }
}
