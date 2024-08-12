import { expect } from "chai";
import hre from "hardhat";
import {
  loadFixture,
  time,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";

async function moveBlocks(amount: number) {
  const [owner, secondAccount] = await hre.ethers.getSigners();
  for (let index = 0; index < amount; index++) {
    // await hre.network.provider.send("emv_mine", []);
    //hardhat don`t allow to send emv_mine with auto mine block
    //so we just send tx
    await owner.sendTransaction({ to: secondAccount, value: 10 });
  }
}

describe("MyGov", function () {
  const OWNER_BALANCE = 40000;
  const SECOND_ACC_BALANCE = 20000;
  const DELAY = 5;
  const FUNC_TO_ENCODE = "doSomethingCool()";
  const PROPOSAL_DESCRIPTION = "DoSomethingEXTRIMLYCool";

  async function deploy() {
    const [owner, secondAccount, thirdAccount] = await hre.ethers.getSigners();
    const MyGovFactory = await hre.ethers.getContractFactory("MyGov");
    const MyTimeLockFactory = await hre.ethers.getContractFactory("MyTimeLock");
    const myGovToken = await hre.ethers.deployContract("MyGovToken");

    //immitate active user
    await myGovToken.mint(owner, OWNER_BALANCE);
    await myGovToken.delegate(owner); //we need to delegate to self
    await myGovToken.mint(secondAccount, SECOND_ACC_BALANCE);
    await myGovToken.connect(secondAccount).delegate(secondAccount);

    const myTimeLock = await MyTimeLockFactory.deploy(5, [], [], owner);

    const myGov = await MyGovFactory.deploy(myGovToken, myTimeLock);

    //grand needed roles
    await myTimeLock.grantRole(
      await myTimeLock.PROPOSER_ROLE(),
      myGov.getAddress()
    );
    await myTimeLock.grantRole(
      await myTimeLock.EXECUTOR_ROLE(),
      myGov.getAddress()
    );

    return {
      myGov,
      myTimeLock,
      myGovToken,
      owner,
      secondAccount,
      thirdAccount,
    };
  }

  async function deployWithPropalsasl() {
    const {
      myGov,
      myTimeLock,
      myGovToken,
      owner,
      secondAccount,
      thirdAccount,
    } = await loadFixture(deploy);

    const encodedFunctionCall = //@ts-ignore
      myTimeLock.interface.encodeFunctionData(FUNC_TO_ENCODE);

    await myGov.propose(
      [myTimeLock.getAddress()],
      [0],
      [encodedFunctionCall],
      PROPOSAL_DESCRIPTION
    );

    //mine Delay block + 1
    await moveBlocks(DELAY + 1);

    let events = await myGov.queryFilter(myGov.filters.ProposalCreated);
    const proposalId = events[events.length - 1].args.proposalId;

    return {
      myGov,
      myTimeLock,
      myGovToken,
      owner,
      secondAccount,
      thirdAccount,
      proposalId,
    };
  }

  describe("Deploy", function () {
    it("Should deploy with balance", async function () {
      const { myGovToken, owner, secondAccount } = await loadFixture(deploy);

      expect(await myGovToken.balanceOf(owner)).to.equal(OWNER_BALANCE);
      expect(await myGovToken.balanceOf(secondAccount)).to.equal(
        SECOND_ACC_BALANCE
      );
    });
  });
  describe("Proposal", function () {
    it("Should create proposal", async function () {
      const { myGov, myTimeLock } = await loadFixture(deploy);

      const encodedFunctionCall = //@ts-ignore
        myTimeLock.interface.encodeFunctionData(FUNC_TO_ENCODE);

      await expect(
        myGov.propose(
          [myTimeLock.getAddress()],
          [0],
          [encodedFunctionCall],
          PROPOSAL_DESCRIPTION
        )
      ).to.emit(myGov, "ProposalCreated");
    });
  });

  describe("Vote", function () {
    it("Should owner vote", async function () {
      const { myGov, owner, proposalId } = await loadFixture(
        deployWithPropalsasl
      );
      const voteWay = 1;

      await expect(myGov.castVote(proposalId, voteWay))
        .to.emit(myGov, "VoteCast")
        .withArgs(owner.address, proposalId, voteWay, OWNER_BALANCE, "");
    });
  });
  describe("Queue and Execute", function () {
    this.timeout(60000);

    it("Should queue and execute", async function () {
      const { myGov, myTimeLock, secondAccount, proposalId } =
        await loadFixture(deployWithPropalsasl);
      const voteWay = 1;
      const BlocksAmountToAwait = 50401;

      await myGov.castVote(proposalId, voteWay);
      await myGov.connect(secondAccount).castVote(proposalId, voteWay);

      await moveBlocks(BlocksAmountToAwait);

      const encodedFunctionCall = //@ts-ignore
        myTimeLock.interface.encodeFunctionData(FUNC_TO_ENCODE);
      const descriptionHash = hre.ethers.keccak256(
        hre.ethers.toUtf8Bytes(PROPOSAL_DESCRIPTION)
      );

      await myGov.queue(
        [myTimeLock.getAddress()],
        [0],
        [encodedFunctionCall],
        descriptionHash
      );

      //we need to move block
      await moveBlocks(DELAY);

      await expect(
        myGov.execute(
          [myTimeLock.getAddress()],
          [0],
          [encodedFunctionCall],
          descriptionHash
        )
      ).to.emit(myTimeLock, "SomethingCool");
    });
  });
});