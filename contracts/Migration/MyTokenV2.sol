// SPDX-License-Identifier: Unlicinse
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MyTokenV2 is ERC20 {
    address immutable owner;
    constructor() ERC20("My Token V2","MT2") {
        owner= msg.sender;
    }
    
    modifier onlyOwner{
        require(owner == msg.sender , "You are not owner of contract");
        _;
    }

    function mint(address to,uint amount) public onlyOwner payable  {
        require(amount != 0, "Not allow to mint zero ammount");
        
        _update(address(0), to, amount );
    }

}