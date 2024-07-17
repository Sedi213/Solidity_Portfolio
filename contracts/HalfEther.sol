// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

//First try creating custom token
contract HalfEther {
    string public name     = "Half Ether";
    string public symbol   = "HETH";
    uint8  public decimals = 18;

    mapping(address => uint) public balances;
    mapping (address => mapping (address => uint))  public  allowance;


    event Approval(address indexed from, address indexed to, uint amount);
    event Transfer(address indexed from, address indexed to, uint amount);
    event Mint(address indexed user,  uint amount);
    event Redeem(address indexed user,  uint amount);

    function myBalance() public  view returns (uint balance){
        return balances[msg.sender];
    }

    function mint() public payable  {
        require(msg.value > 0, "Not allow to mint zero ammount");
        balances[msg.sender] += msg.value*2;
        emit Mint(msg.sender, msg.value*2);
    }

    function redeem(uint amount) public payable   {
        require(balances[msg.sender] >= amount, "Insufficient Balance");
        balances[msg.sender] -= amount;
        payable(msg.sender).transfer(amount/2);
        emit Redeem(msg.sender, amount);
    }


    function approve(address to, uint amount) public  {
        allowance[msg.sender][to] = amount;
        emit Approval(msg.sender, to, amount);
    }

    function transfetTo(address from, address to , uint amount) public {
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