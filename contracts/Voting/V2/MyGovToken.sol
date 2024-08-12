// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.20;

import {ERC20Votes, ERC20} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";

contract MyGovToken is ERC20Votes {
    address public immutable owner;

    constructor()
        ERC20("GovernanceToken", "GT")
        EIP712("GovernanceToken", "1")
    {
        owner = msg.sender;
    }

    function mint(address to, uint256 amount) public {
        require(owner == msg.sender, "Not owner");
        _mint(to, amount);
    }
}
