// SPDX-License-Identifier: Unlicinse
pragma solidity 0.8.26;
// 0.8.26 introduce require functions with custom errors, at this time for the via IR pipeline only

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract LiquidityPool {
    IERC20 public immutable token1;
    IERC20 public immutable token0;

    uint constant FEE = 990; //1% (1000 - 10) where 10 = 1%

    uint256 public reserve0;
    uint256 public reserve1;
    uint256 public totalLockedAmount;
    mapping(address => uint256) public balanceOf;

    event LiquidityAdded(
        address indexed _from,
        uint256 amount0,
        uint256 amount1,
        uint256 shares
    );
    event LiquidityRemoved(
        address indexed _to,
        uint256 amount0,
        uint256 amount1,
        uint256 shares
    );

    error NotEquelAddedLiquidity();
    error InsufficientBalance();
    error InvalidToken();
    error ZeroAmount();

    constructor(IERC20 _token0, IERC20 _token1) {
        token0 = _token0;
        token1 = _token1;
    }

    function swap(
        address _tokenIn,
        uint256 _amountIn
    ) external returns (uint256 amountOut) {
        require(
            _tokenIn == address(token0) || _tokenIn == address(token1),
            InvalidToken()
        );
        require(_amountIn > 0, ZeroAmount());

        bool isToken0 = _tokenIn == address(token0);
        (
            IERC20 tokenIn,
            IERC20 tokenOut,
            uint256 reserveIn,
            uint256 reserveOut
        ) = isToken0
                ? (token0, token1, reserve0, reserve1)
                : (token1, token0, reserve1, reserve0);
        //msg.sender must approve for contract
        tokenIn.transferFrom(msg.sender, address(this), _amountIn);

        uint256 amountInWithFee = (_amountIn * FEE) / 1000;
        amountOut =
            (reserveOut * amountInWithFee) /
            (reserveIn + amountInWithFee);

        tokenOut.transfer(msg.sender, amountOut);

        _update(
            token0.balanceOf(address(this)),
            token1.balanceOf(address(this))
        );
    }

    function depositeLiquidity(
        uint256 _amount0,
        uint256 _amount1
    ) external returns (uint256 shares) {
        if (reserve0 > 0 || reserve1 > 0) {
            require(
                reserve0 * _amount1 == reserve1 * _amount0,
                NotEquelAddedLiquidity()
            );
        }
        require(_amount0 != 0 && _amount1 != 0, ZeroAmount());
        //msg.sender must approve for contract
        token0.transferFrom(msg.sender, address(this), _amount0);
        token1.transferFrom(msg.sender, address(this), _amount1);

        if (totalLockedAmount == 0) {
            shares = _sqrt(_amount0 * _amount1);
        } else {
            shares = _min(
                (_amount0 * totalLockedAmount) / reserve0,
                (_amount1 * totalLockedAmount) / reserve1
            );
        }
        require(shares > 0, "shares = 0");
        _mint(msg.sender, shares);

        _update(
            token0.balanceOf(address(this)),
            token1.balanceOf(address(this))
        );

        emit LiquidityAdded(msg.sender, _amount0, _amount1, shares);
    }

    function removeLiquidity(
        uint256 _shares
    ) external returns (uint256 amount0, uint256 amount1) {
        if (balanceOf[msg.sender] < _shares) {
            revert InsufficientBalance();
        }

        amount0 = (_shares * reserve0) / totalLockedAmount;
        amount1 = (_shares * reserve1) / totalLockedAmount;
        require(amount0 > 0 && amount1 > 0, "amount0 or amount1 = 0");

        _burn(msg.sender, _shares);
        _update(reserve0 - amount0, reserve1 - amount1);

        token0.transfer(msg.sender, amount0);
        token1.transfer(msg.sender, amount1);

        emit LiquidityRemoved(msg.sender, amount0, amount1, _shares);
    }

    function _mint(address _to, uint256 _amount) private {
        balanceOf[_to] += _amount;
        totalLockedAmount += _amount;
    }

    function _burn(address _from, uint256 _amount) private {
        balanceOf[_from] -= _amount;
        totalLockedAmount -= _amount;
    }

    function _update(uint256 _reserve0, uint256 _reserve1) private {
        reserve0 = _reserve0;
        reserve1 = _reserve1;
    }

    function _sqrt(uint256 y) private pure returns (uint256 z) {
        if (y > 3) {
            z = y;
            uint256 x = y / 2 + 1;
            while (x < z) {
                z = x;
                x = (y / x + x) / 2;
            }
        } else if (y != 0) {
            z = 1;
        }
    }

    function _min(uint256 x, uint256 y) private pure returns (uint256) {
        return x <= y ? x : y;
    }
}
