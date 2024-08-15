import { expect } from "chai";
import hre, { ethers } from "hardhat";
import {
  loadFixture,
  time,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import "@nomicfoundation/hardhat-ethers";
import { formatEther } from "ethers";

describe("AutoMarketMaker", function () {
  const TokensAmount = 1000;
  const HalfTokensAmount = TokensAmount / 2;

  //deploy section
  async function deployContractsWithBalances() {
    const [owner, secondAccount] = await ethers.getSigners();

    const poolsManager = await ethers.deployContract("PoolsManager");
    const myToken0 = await ethers.deployContract("MyToken0");
    const myToken1 = await ethers.deployContract("MyToken1");
    const myToken2 = await ethers.deployContract("MyToken2");

    //immitate balances
    myToken0.mint(owner, TokensAmount);
    myToken1.mint(owner, TokensAmount);
    myToken2.mint(owner, TokensAmount);

    myToken0.mint(secondAccount, HalfTokensAmount);
    myToken1.mint(secondAccount, HalfTokensAmount);
    myToken2.mint(secondAccount, HalfTokensAmount);

    return {
      poolsManager,
      myToken0,
      myToken1,
      myToken2,
      owner,
      secondAccount,
    };
  }

  async function deployWithPools() {
    const { poolsManager, myToken0, myToken1, myToken2, owner, secondAccount } =
      await loadFixture(deployContractsWithBalances);
    await poolsManager.createPool(myToken0, myToken1);
    await poolsManager.createPool(myToken0, myToken2);
    let events = await poolsManager.queryFilter(
      poolsManager.filters.PoolCreated
    );

    const addressOffirstPool = events[events.length - 2].args.pool;
    const addressOfSecondPool = events[events.length - 1].args.pool;
    const firstPool = await ethers.getContractAt(
      "LiquidityPool",
      addressOffirstPool
    );
    const SecondPool = await ethers.getContractAt(
      "LiquidityPool",
      addressOfSecondPool
    );

    return {
      poolsManager,
      myToken0,
      myToken1,
      myToken2,
      firstPool,
      SecondPool,
      owner,
      secondAccount,
    };
  }

  async function deployWithFulfilledPools() {
    const {
      poolsManager,
      myToken0,
      myToken1,
      myToken2,
      firstPool,
      SecondPool,
      owner,
      secondAccount,
    } = await loadFixture(deployWithPools);

    await myToken0.approve(firstPool, TokensAmount);
    await myToken1.approve(firstPool, TokensAmount);

    await firstPool.depositeLiquidity(TokensAmount, TokensAmount);

    return {
      poolsManager,
      myToken0,
      myToken1,
      myToken2,
      firstPool,
      SecondPool,
      owner,
      secondAccount,
    };
  }

  describe("PoolsManager", function () {
    it("Should deploy", async function () {
      await loadFixture(deployContractsWithBalances);
    });

    it("Should create pool", async function () {
      const { poolsManager, myToken0, myToken1 } = await loadFixture(
        deployContractsWithBalances
      );

      await poolsManager.createPool(myToken0, myToken1);
    });

    it("Should revert if not owner call createpool", async function () {
      const { poolsManager, myToken0, myToken1, secondAccount } =
        await loadFixture(deployContractsWithBalances);
      await expect(
        poolsManager.connect(secondAccount).createPool(myToken0, myToken1)
      ).to.be.revertedWithCustomError(poolsManager, "NotOwner");
    });

    it("Should revert if Pool already exist", async function () {
      const { poolsManager, myToken0, myToken1 } = await loadFixture(
        deployContractsWithBalances
      );

      await poolsManager.createPool(myToken0, myToken1);
      await expect(
        poolsManager.createPool(myToken0, myToken1)
      ).to.be.revertedWithCustomError(poolsManager, "PoolAlreadyExist");
    });

    it("Should PoolExist return false", async function () {
      const { poolsManager, myToken0, myToken1 } = await loadFixture(
        deployContractsWithBalances
      );

      expect(await poolsManager.poolExists(myToken0, myToken1)).to.equal(false);
      expect(await poolsManager.poolExists(myToken1, myToken0)).to.equal(false);
    });

    it("Should PoolExist return true", async function () {
      const { poolsManager, myToken0, myToken1 } = await loadFixture(
        deployContractsWithBalances
      );

      await poolsManager.createPool(myToken0, myToken1);

      expect(await poolsManager.poolExists(myToken0, myToken1)).to.equal(true);
      expect(await poolsManager.poolExists(myToken1, myToken0)).to.equal(true);
    });

    it("Should return valid address fo deployed pool", async function () {
      const { poolsManager, myToken0, myToken1 } = await loadFixture(
        deployContractsWithBalances
      );

      await poolsManager.createPool(myToken0, myToken1);

      expect(await poolsManager.poolsAddress(myToken0, myToken1)).to.not.equal(
        ethers.ZeroAddress
      );
    });

    it("Should emit PoolCreated on createpool", async function () {
      const { poolsManager, myToken0, myToken1 } = await loadFixture(
        deployContractsWithBalances
      );

      await expect(poolsManager.createPool(myToken0, myToken1)).to.emit(
        poolsManager,
        "PoolCreated"
      );
    });
  });
  describe("LiquidityPool", function () {
    describe("depositeLiquidity", function () {
      it("Should add liquidity", async function () {
        const { firstPool, myToken0, myToken1, owner } = await loadFixture(
          deployWithPools
        );

        await myToken0.approve(firstPool, TokensAmount);
        await myToken1.approve(firstPool, TokensAmount);

        await firstPool.depositeLiquidity(TokensAmount, TokensAmount);

        expect(await firstPool.balanceOf(owner)).to.not.equal(0);
      });

      it("Should add liquidity twice", async function () {
        const { firstPool, myToken0, myToken1, owner, secondAccount } =
          await loadFixture(deployWithPools);

        await myToken0.approve(firstPool, TokensAmount);
        await myToken1.approve(firstPool, TokensAmount);

        await firstPool.depositeLiquidity(TokensAmount, TokensAmount);

        await myToken0
          .connect(secondAccount)
          .approve(firstPool, HalfTokensAmount);
        await myToken1
          .connect(secondAccount)
          .approve(firstPool, HalfTokensAmount);

        await firstPool
          .connect(secondAccount)
          .depositeLiquidity(HalfTokensAmount, HalfTokensAmount);
        expect(await firstPool.balanceOf(secondAccount)).to.not.equal(0);
      });

      it("Should revert if send more amount that balance", async function () {
        const { firstPool, myToken0, myToken1, owner } = await loadFixture(
          deployWithPools
        );

        await myToken0.approve(firstPool, TokensAmount * 2);
        await myToken1.approve(firstPool, TokensAmount * 2);

        await expect(
          firstPool.depositeLiquidity(TokensAmount * 2, TokensAmount * 2)
        ).to.be.revertedWithCustomError(myToken0, "ERC20InsufficientBalance");
      });

      it("Should revert if Zero amount", async function () {
        const { firstPool, myToken0, myToken1, owner } = await loadFixture(
          deployWithPools
        );

        await myToken0.approve(firstPool, TokensAmount);
        await myToken1.approve(firstPool, TokensAmount);

        await expect(
          firstPool.depositeLiquidity(0, 0)
        ).to.be.revertedWithCustomError(firstPool, "ZeroAmount");
      });

      it("Should revert if amount not equal", async function () {
        const { firstPool, myToken0, myToken1, owner, secondAccount } =
          await loadFixture(deployWithPools);

        await myToken0.approve(firstPool, TokensAmount);
        await myToken1.approve(firstPool, TokensAmount);
        await firstPool.depositeLiquidity(TokensAmount, TokensAmount);

        await myToken0
          .connect(secondAccount)
          .approve(firstPool, HalfTokensAmount);
        await myToken1
          .connect(secondAccount)
          .approve(firstPool, HalfTokensAmount);
        await expect(
          firstPool
            .connect(secondAccount)
            .depositeLiquidity(HalfTokensAmount, HalfTokensAmount / 2)
        ).to.be.revertedWithCustomError(firstPool, "NotEquelAddedLiquidity");
      });

      it("Should revert if not approved", async function () {
        const { firstPool, myToken0, myToken1, owner } = await loadFixture(
          deployWithPools
        );

        await expect(
          firstPool.depositeLiquidity(TokensAmount * 2, TokensAmount * 2)
        ).to.be.revertedWithCustomError(myToken0, "ERC20InsufficientAllowance");
      });

      it("Should emit LiquidityAdded", async function () {
        const { firstPool, myToken0, myToken1 } = await loadFixture(
          deployWithPools
        );

        await myToken0.approve(firstPool, TokensAmount);
        await myToken1.approve(firstPool, TokensAmount);

        await expect(
          firstPool.depositeLiquidity(TokensAmount, TokensAmount)
        ).to.emit(firstPool, "LiquidityAdded");
      });
    });

    describe("swap", function () {
      const swapAmount = HalfTokensAmount / 2;
      it("Should swap", async function () {
        const { myToken0, myToken1, firstPool, secondAccount } =
          await loadFixture(deployWithFulfilledPools);

        await myToken0.connect(secondAccount).approve(firstPool, swapAmount);

        await firstPool.connect(secondAccount).swap(myToken0, swapAmount);

        expect(await myToken1.balanceOf(secondAccount)).to.greaterThan(
          HalfTokensAmount
        );
      });

      it("Should swap twice (with new price)", async function () {
        const { myToken0, myToken1, firstPool, secondAccount } =
          await loadFixture(deployWithFulfilledPools);

        await myToken0
          .connect(secondAccount)
          .approve(firstPool, HalfTokensAmount);

        await firstPool.connect(secondAccount).swap(myToken0, swapAmount);

        const CountOFTokenAfterFirstSwap = await myToken1.balanceOf(
          secondAccount
        );

        await firstPool.connect(secondAccount).swap(myToken0, swapAmount);

        expect(await myToken1.balanceOf(secondAccount)).to.greaterThan(
          CountOFTokenAfterFirstSwap
        );
      });

      it("Should revert if wrong token In", async function () {
        const { firstPool, myToken2, secondAccount } = await loadFixture(
          deployWithFulfilledPools
        );
        await myToken2.connect(secondAccount).approve(firstPool, swapAmount);
        await expect(
          firstPool.connect(secondAccount).swap(myToken2, swapAmount)
        ).to.be.revertedWithCustomError(firstPool, "InvalidToken");
      });

      it("Should revert if not approved", async function () {
        const { firstPool, myToken0, myToken1, owner } = await loadFixture(
          deployWithFulfilledPools
        );

        await expect(
          firstPool.swap(myToken0, swapAmount)
        ).to.be.revertedWithCustomError(myToken0, "ERC20InsufficientAllowance");
      });

      it("Should revert if send more amount that balance", async function () {
        const { firstPool, myToken0, myToken1, secondAccount } =
          await loadFixture(deployWithFulfilledPools);
        const amountForTest = swapAmount * 4;

        await myToken0.connect(secondAccount).approve(firstPool, amountForTest);
        await myToken1.connect(secondAccount).approve(firstPool, amountForTest);

        await expect(
          firstPool
            .connect(secondAccount)
            .depositeLiquidity(amountForTest, amountForTest)
        ).to.be.revertedWithCustomError(myToken0, "ERC20InsufficientBalance");
      });
    });

    describe("removeLiquidity", function () {
      it("Should removeLiquidity", async function () {
        const { firstPool, myToken0, myToken1, owner } = await loadFixture(
          deployWithFulfilledPools
        );
        const sharedAmount = await firstPool.balanceOf(owner);

        await firstPool.removeLiquidity(sharedAmount);

        expect(await firstPool.balanceOf(owner)).to.equal(0);
        expect(await myToken0.balanceOf(owner)).to.equal(TokensAmount);
        expect(await myToken1.balanceOf(owner)).to.equal(TokensAmount);
      });
      it("Should removeLiquidity and get more tokens after swap (Receive FEE)", async function () {
        const { firstPool, myToken0, myToken1, owner, secondAccount } =
          await loadFixture(deployWithFulfilledPools);

        //swap (Fee took)
        await myToken0
          .connect(secondAccount)
          .approve(firstPool, HalfTokensAmount);

        await firstPool.connect(secondAccount).swap(myToken0, HalfTokensAmount);

        //remove liquidity
        const sharedAmount = await firstPool.balanceOf(owner);

        await firstPool.removeLiquidity(sharedAmount);

        expect(await firstPool.balanceOf(owner)).to.equal(0);

        expect(
          (await myToken0.balanceOf(owner)) + (await myToken1.balanceOf(owner))
        ).to.greaterThan(TokensAmount * 2);
      });
      it("Should revert if don`t have shared", async function () {
        const { firstPool, secondAccount } = await loadFixture(
          deployWithFulfilledPools
        );

        await expect(
          firstPool.connect(secondAccount).removeLiquidity(HalfTokensAmount)
        ).to.be.revertedWithCustomError(firstPool, "InsufficientBalance");
      });
      it("Should revert if remove more shared that have", async function () {
        const { firstPool } = await loadFixture(deployWithFulfilledPools);

        await expect(
          firstPool.removeLiquidity(TokensAmount * 2)
        ).to.be.revertedWithCustomError(firstPool, "InsufficientBalance");
      });
    });
  });
});
