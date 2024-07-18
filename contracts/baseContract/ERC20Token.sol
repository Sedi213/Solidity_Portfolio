// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

//First try creating custom token
 abstract contract ERC20Token {
    string public name   ;
    string public symbol ;
    uint8  public decimals;

    mapping(address => uint) public balances;
    mapping (address => mapping (address => uint))  public  allowance;


    event Approval(address indexed from, address indexed to, uint amount);
    event Transfer(address indexed from, address indexed to, uint amount);
    event Mint(address indexed user,  uint amount);
    event Redeem(address indexed user,  uint amount);

    function myBalance() public  view returns (uint balance){
        return balances[msg.sender];
    }

    function balanceOf(address value) public  view returns (uint balance){
        return balances[value];
    }

    function mint() public virtual payable;

    function redeem(uint amount) public virtual payable;

    function approve(address to, uint amount) public  {
        allowance[msg.sender][to] = amount;
        emit Approval(msg.sender, to, amount);
    }

    function transfetFrom(address from, address to , uint amount) public {
        require(amount <= balances[from], "Insufficient Balance");

        if (from != msg.sender) {
            require(allowance[from][msg.sender] >= amount);
            allowance[from][msg.sender] -= amount;
        }

        balances[from] -= amount;
        balances[to] += amount;

        emit Transfer(msg.sender, to, amount);
    }

}