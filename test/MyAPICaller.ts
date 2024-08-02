import { expect } from "chai";
import hre, { ethers } from "hardhat";
import {
  loadFixture,
  time,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";

describe("MyAPICaller", function () {
  async function GetContractInstance() {
    const [owner, _] = await hre.ethers.getSigners();
    //contract must have LINK token balance
    const myAPICaller = await hre.ethers.getContractAt(
      "MyAPICaller",
      "0x4E010E06E0eEE6A783250bE23703bF5E377931CD"
    );
    return { myAPICaller, owner };
  }

  it("Should send request", async function () {
    const { myAPICaller } = await GetContractInstance();

    expect(await myAPICaller.requestVolumeData()).to.emit(
      myAPICaller,
      "RequestVolumeSend"
    );
  });
  it("Should receive response", async function () {
    const { myAPICaller } = await GetContractInstance();

    await new Promise(async (resolve, reject) => {
      myAPICaller.once("RequestVolumeReceive", async () => {
        expect(await myAPICaller.volume()).to.above(1);
        resolve("done");
      });
    });
  });
});
