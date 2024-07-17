import { expect } from "chai";
import hre from "hardhat";
import { loadFixture, time } from "@nomicfoundation/hardhat-toolbox/network-helpers";

describe("HalfEther", async function () {
    const onGwei = 10**9;

    


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
                value: onGwei,
            })

            expect(await halfEther.myBalance()).to.equal(onGwei * 2);
        })
        
        it("Should otherAccount have 0 balance", async function () {
            const {halfEther, otherAccount} = await loadFixture(deployHalfEther);

            await halfEther.mint({
                value: onGwei,
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

           await expect(halfEther.mint({value: onGwei,}))
           .to.emit(halfEther, "Mint")
           .withArgs(owner, onGwei*2);
        })
    })

})