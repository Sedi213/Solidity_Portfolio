import { expect } from "chai";
import hre from "hardhat";
import { loadFixture, time } from "@nomicfoundation/hardhat-toolbox/network-helpers";

describe("HalfEther", async function () {
    const oneGwei = 10**9;
    const InsufficientBalanceErrorText = "Insufficient Balance";

    describe("Mint",function(){
        const zeroMintErrorText = "Not allow to mint zero ammount";

        async function deployHalfEther() {
        
            const [owner, otherAccount] = await hre.ethers.getSigners();
            const halfEther = await hre.ethers.deployContract("HalfEther");
            return { halfEther, owner, otherAccount};
        }
        
        it("Should mint 2*10^9 tokes", async function () {
            const {halfEther} = await loadFixture(deployHalfEther);

            await halfEther.mint({
                value: oneGwei,
            })

            expect(await halfEther.myBalance()).to.equal(oneGwei * 2);
        })
        
        it("Should otherAccount have 0 balance", async function () {
            const {halfEther, otherAccount} = await loadFixture(deployHalfEther);

            await halfEther.mint({
                value: oneGwei,
            })

            expect(await halfEther.connect(otherAccount).myBalance()).to.equal(0);
        })

        it("Should revert with the right error if mint amount 0", async function () {
            const {halfEther} = await loadFixture(deployHalfEther);

           await expect(halfEther.mint({value: 0,}))
           .to.be.revertedWith(zeroMintErrorText);
        })

        it("Should emit Mint", async function () {
            const {halfEther, owner} = await loadFixture(deployHalfEther);

           await expect(halfEther.mint({value: oneGwei,}))
           .to.emit(halfEther, "Mint")
           .withArgs(owner, oneGwei*2);
        })
    })

    describe("Redeem", function(){

        async function deployHalfEtherWithBalance() {
            const [owner, otherAccount] = await hre.ethers.getSigners();
            const halfEther = await hre.ethers.deployContract("HalfEther");

            await halfEther.mint({
                value: oneGwei,
            })
            await halfEther.connect(otherAccount).mint({
                value: oneGwei,
            })

            return { halfEther, owner, otherAccount};
        }
        
        it("Should successfully redeem 10^9 tokens", async function () {
            const {halfEther} = await loadFixture(deployHalfEtherWithBalance);

            //on start balance = 2*onGwei
            await halfEther.redeem(oneGwei)

            expect(await halfEther.myBalance()).to.equal(oneGwei);
        })
        
        it("Should after redeem, otherAccount have init balance", async function () {
            const {halfEther, otherAccount} = await loadFixture(deployHalfEtherWithBalance);

            await halfEther.redeem(oneGwei)

            expect(await halfEther.connect(otherAccount).myBalance()).to.equal(oneGwei*2);
        })

        it("Should revert with the right error if redeem amount bigger than balance", async function () {
            const {halfEther} = await loadFixture(deployHalfEtherWithBalance);

           await expect(halfEther.redeem(oneGwei*3))
           .to.be.revertedWith(InsufficientBalanceErrorText);
        })

        it("Should emit Redeem", async function () {
            const {halfEther, owner} = await loadFixture(deployHalfEtherWithBalance);

           await expect(halfEther.redeem(oneGwei))
           .to.emit(halfEther, "Redeem")
           .withArgs(owner, oneGwei);
        })
    })

    async function deployHalfEtherWithOwnerBalance() {
        const [owner, otherAccount] = await hre.ethers.getSigners();
        const halfEther = await hre.ethers.deployContract("HalfEther");

        await halfEther.mint({
            value: oneGwei,
        })

        return { halfEther, owner, otherAccount};
    }

    describe("Transfer as owner", function(){

        it("Should successfully transwer 10^9 tokens", async function () {
            const {halfEther, owner, otherAccount} = await loadFixture(deployHalfEtherWithOwnerBalance);

            //on start owner balance = 2*oneGwei
            await halfEther.transfetFrom(owner, otherAccount, oneGwei)

            expect(await halfEther.myBalance()).to.equal(oneGwei);
            expect(await halfEther.connect(otherAccount).myBalance()).to.equal(oneGwei);
        })
        

        it("Should revert with the right error if transfer amount bigger than balance", async function () {
            const {halfEther, owner, otherAccount} = await loadFixture(deployHalfEtherWithOwnerBalance);

           await expect(halfEther.transfetFrom(owner, otherAccount, oneGwei*3))
           .to.be.revertedWith(InsufficientBalanceErrorText);
        })

        it("Should emit Transfer", async function () {
            const {halfEther, owner, otherAccount} = await loadFixture(deployHalfEtherWithOwnerBalance);

           await expect(halfEther.transfetFrom(owner, otherAccount, oneGwei))
           .to.emit(halfEther, "Transfer")
           .withArgs(owner, otherAccount, oneGwei);
        })
    })

    describe("Approve and Transfer", function(){
        
        it("Should successfully approve 10^9 tokens", async function () {
            const {halfEther,owner, otherAccount} = await loadFixture(deployHalfEtherWithOwnerBalance);

            await halfEther.approve(otherAccount, oneGwei)

            expect(await halfEther.allowance(owner, otherAccount)).to.equal(oneGwei);
        })
        
        it("Should successfully approve and transwer 10^9 tokens", async function () {
            const {halfEther,owner, otherAccount} = await loadFixture(deployHalfEtherWithOwnerBalance);

            await halfEther.approve(otherAccount, oneGwei)
            expect(await halfEther.allowance(owner,otherAccount)).to.equal(oneGwei);

            await halfEther.connect(otherAccount).transfetFrom(owner, otherAccount, oneGwei)
            expect(await halfEther.myBalance()).to.equal(oneGwei);
            expect(await halfEther.connect(otherAccount).myBalance()).to.equal(oneGwei);
            expect(await halfEther.allowance(owner, otherAccount)).to.equal(0);
        })

        it("Should revert with the right error if transfer amount bigger than balance", async function () {
            const {halfEther, owner, otherAccount} = await loadFixture(deployHalfEtherWithOwnerBalance);

            await halfEther.approve(otherAccount, oneGwei)
            expect(await halfEther.allowance(owner, otherAccount)).to.equal(oneGwei);

           await expect(halfEther.connect(otherAccount).transfetFrom(owner, otherAccount, oneGwei*3))
           .to.be.revertedWith(InsufficientBalanceErrorText);
        })
    })
})