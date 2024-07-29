// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IBalanceProvider} from "./IBalanceProvider.sol";

//I understand that storage balances in blockchain is NOT gas effective
//Ideally, We can take snapshot balances even for past
//For this we have to find address of contract and find block when it was deployed
// than we looking for needed function (mint and transfer)
//and run it from delpoy block to needed snapshot block
//creating our own address/balance list
//and all this can be done gasless

contract OnChainERC20Snapshot is IBalanceProvider {
    mapping(address => uint) public balances;

    function balanceOf(address value) public view returns (uint balance) {
        return balances[value];
    }

    function takeSnapshotBalances(
        ERC20 contractAdress,
        address[] memory usersAddresses
    ) external {

        for (uint i = 0; i < usersAddresses.length; i++) {
            balances[usersAddresses[i]] = contractAdress.balanceOf(
                usersAddresses[i]
            );
        }

    }
}
