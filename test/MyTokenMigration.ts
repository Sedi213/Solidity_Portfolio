import { expect } from "chai";
import hre from "hardhat";
import {
  loadFixture,
  time,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { MyTokenV2 } from "../typechain-types";

describe("HalfEther", function () {
  const oneGwei = 10 ** 9;

  async function deployWithBalance() {
    const [owner, otherAccount] = await hre.ethers.getSigners();
    const myOldToken = await hre.ethers.deployContract("MyToken");

    await myOldToken.mint(otherAccount, oneGwei);

    const MyTokenMigrationFactory = await hre.ethers.getContractFactory(
      "MyTokenMigration"
    );
    const myTokenMigration = await MyTokenMigrationFactory.deploy(myOldToken);
    const myNewToken = await hre.ethers.getContractAt(
      "MyTokenV2",
      await myTokenMigration.newContractAddress()
    );

    return { myOldToken, myTokenMigration, myNewToken, owner, otherAccount };
  }

  describe("Deploy", function () {
    it("Should set oldTokenContract correctly", async function () {
      const { myTokenMigration, myOldToken } = await loadFixture(
        deployWithBalance
      );

      expect(await myTokenMigration.oldContractAddress()).to.equal(
        await myOldToken.getAddress()
      );
    });

    it("Should otherAccount have balance on oldToken", async function () {
      const { myOldToken, otherAccount } = await loadFixture(deployWithBalance);

      expect(await myOldToken.balanceOf(otherAccount)).to.equal(oneGwei);
    });
  });

  describe("Migrate", function () {
    it("Should migrate after approval", async function () {
      const { myTokenMigration, myOldToken, myNewToken, otherAccount } =
        await loadFixture(deployWithBalance);

      await myOldToken
        .connect(otherAccount)
        .approve(await myTokenMigration.getAddress(), oneGwei);

      await myTokenMigration.connect(otherAccount).migrate();

      expect(await myOldToken.balanceOf(otherAccount)).to.equal(0);
      expect(await myNewToken.balanceOf(otherAccount)).to.equal(oneGwei * 2);
    });

    it("Should migrate revert if not approved", async function () {
      const { myTokenMigration, myOldToken, myNewToken, otherAccount } =
        await loadFixture(deployWithBalance);

      await expect(
        myTokenMigration.connect(otherAccount).migrate()
      ).to.be.revertedWithCustomError(
        myTokenMigration,
        "NotInAllowanceBalance"
      );
    });

    it("Should migrate revert if not balance", async function () {
      const { myTokenMigration, myOldToken, myNewToken, otherAccount } =
        await loadFixture(deployWithBalance);

      //owner connected
      await expect(myTokenMigration.migrate()).to.be.revertedWithCustomError(
        myTokenMigration,
        "InsufficientBalance"
      );
    });
  });
});
