// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20Token} from "./baseContract/ERC20Token.sol";

//First try creating custom token
contract HalfEther is ERC20Token {

    constructor() {
        name     = "Half Ether";
        symbol   = "HETH";
        decimals = 18;
    }
    
    function mint() public override payable  {
        require(msg.value > 0, "Not allow to mint zero ammount");
        balances[msg.sender] += msg.value*2;
        emit Mint(msg.sender, msg.value*2);
    }

    function redeem(uint amount) override public payable   {
        require(balances[msg.sender] >= amount, "Insufficient Balance");
        balances[msg.sender] -= amount;
        payable(msg.sender).transfer(amount/2);
        emit Redeem(msg.sender, amount);
    }

}