// SPDX-License-Identifier: Unlicinse
pragma solidity 0.8.26;

import {LiquidityPool} from "./LiquidityPool.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract PoolsManager {
    mapping(address => mapping(address => address)) public poolsAddress;

    address private owner;
    error NotOwner();
    error PoolAlreadyExist();

    event PoolCreated(address _token0, address _token1, address pool);

    constructor() {
        owner = msg.sender;
    }

    function createPool(
        address _token0,
        address _token1
    ) external returns (address poolAddress) {
        require(msg.sender == owner, NotOwner());
        require(!poolExists(_token0, _token1), PoolAlreadyExist());

        LiquidityPool newPool = new LiquidityPool(
            IERC20(_token0),
            IERC20(_token1)
        );
        poolAddress = address(newPool);
        poolsAddress[_token0][_token1] = poolAddress;

        emit PoolCreated(_token0, _token1, poolAddress);
    }

    function poolExists(
        address _token0,
        address _token1
    ) public view returns (bool _exists) {
        _exists =
            poolsAddress[_token0][_token1] != address(0) ||
            poolsAddress[_token1][_token0] != address(0);
    }
}
