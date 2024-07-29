import { expect } from "chai";
import hre, { ethers } from "hardhat";
import { loadFixture, time } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import "@nomicfoundation/hardhat-ethers";
import { formatEther } from "ethers";

describe("ERC20TokenVoting", async function () {
    const oneGwei = 10**9;

    async function deployContractsWithBalances() {
        const [owner, secondAccount,thirdAccount] = await hre.ethers.getSigners();

        const ONE_MOUNTH_IN_SECS = 30 * 24 * 60 * 60;
        const endVotingTime = (await time.latest()) + ONE_MOUNTH_IN_SECS;

        const myToken = await hre.ethers.deployContract("MyToken");
        const onChainERC20Snapshot = await hre.ethers.deployContract("OnChainERC20Snapshot");

        //immitate users wit balance before snapshot 
        await myToken.mint(owner, oneGwei);
        await myToken.mint(secondAccount, oneGwei);

        onChainERC20Snapshot.takeSnapshotBalances(myToken ,[owner , secondAccount]);

        let proposal1 = "Buy food";
        let proposal2 = "Buy crypto";
        let proposal3 = "Buy milk";

        const Voting = await hre.ethers.getContractFactory("BalanceVoting");
        const voting = await Voting.deploy(endVotingTime, onChainERC20Snapshot,
            [proposal1, proposal2, proposal3]);

        return {myToken, onChainERC20Snapshot, endVotingTime, voting, owner, secondAccount, thirdAccount};
    }

    describe("Vote", function(){

        it("Should owner vote", async function() {
            const {voting} = await loadFixture(deployContractsWithBalances);

            await voting.vote(1);
            
            var {weight,vote} =  await voting.getMyVote();

            expect(weight).to.equal(oneGwei);
            expect(vote).to.equal(1);
        })

        it("Should revert with the right error if voter dont have weight", async function() {
            const {voting, thirdAccount} = await loadFixture(deployContractsWithBalances);
            const notRightToVoteError="Has no right to vote";

            await expect(voting.connect(thirdAccount).vote(1)).to.be.revertedWith(notRightToVoteError);
        })

        it("Should emit Vote", async function () {
        const {voting,owner} = await loadFixture(deployContractsWithBalances);

        const proposal = 1;

           await expect(voting.vote(proposal))
           .to.emit(voting, "Vote")
           .withArgs(owner, proposal);
        })
    })
    describe("Winning proposal", function(){
        it("Should revert with the right error if voting is still running", async function(){
            const {voting} = await loadFixture(deployContractsWithBalances);
            const expectedError = "Voting is still running";

            await expect(voting.winningProposal()).to.be.revertedWith(expectedError);

        })
        it("Should get winner after end of voting", async function(){
            const {voting,endVotingTime} = await loadFixture(deployContractsWithBalances);
            
            await voting.vote(1);
            await time.increaseTo(endVotingTime + 1);

            expect(await voting.winningProposal()).to.equal(1);
        })
    })
    describe("Delegate", function(){
        it("Should delegate (delegate person NOT vote yet)", async function(){
            const {voting, secondAccount} = await loadFixture(deployContractsWithBalances);
            const proposalIndex = 1;

            await voting.delegate(secondAccount);

            await voting.connect(secondAccount).vote(proposalIndex);

            var {weight,vote} =  await voting.connect(secondAccount).getMyVote();

            expect(weight).to.equal(oneGwei * 2);
            expect(vote).to.equal(1);

        })
        it("Should delegate (delegate person vote yet)", async function(){
            const {voting, secondAccount} = await loadFixture(deployContractsWithBalances);
            const proposalIndex = 1;

            await voting.connect(secondAccount).vote(proposalIndex);

            await voting.delegate(secondAccount);
            let {voteCount} = await voting.proposals(proposalIndex);
            expect(voteCount).to.equal(oneGwei * 2);
        })
        it("Should revert if delegator have 0 wieght", async function(){
            const {voting, thirdAccount} = await loadFixture(deployContractsWithBalances);
            const notRightToVoteError = "Delegator not allowed to vote";

            await expect(voting.delegate(thirdAccount)).to.be.revertedWith(notRightToVoteError);
        })
        it("Should revert if owner have 0 wieght", async function(){
            const {voting, thirdAccount, owner} = await loadFixture(deployContractsWithBalances);
            const notRightToVoteError = "You have no right to vote";

            await expect(voting.connect(thirdAccount).delegate(owner)).to.be.revertedWith(notRightToVoteError);
        })
    })
})