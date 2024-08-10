// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.24;

interface IBalanceProvider {
    function balanceOf(address value) external view returns (uint balance);
}
