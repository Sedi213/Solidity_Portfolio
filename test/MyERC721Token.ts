import { expect } from "chai";
import hre, { ethers } from "hardhat";
import { loadFixture, time } from "@nomicfoundation/hardhat-toolbox/network-helpers";

describe("MyERC721Token", async function () {

    async function delpoy() {
        const [owner, secondAccount, thirdAccount] = await hre.ethers.getSigners();
        const myERC721Token = await hre.ethers.deployContract("MyERC721Token");
        return {myERC721Token, owner, secondAccount, thirdAccount};
    }

    async function delpoyWithBalance() {
        const [owner, secondAccount, thirdAccount] = await hre.ethers.getSigners();
        const myERC721Token = await hre.ethers.deployContract("MyERC721Token");

        await myERC721Token.mint(secondAccount, "URI");

        return {myERC721Token, owner, secondAccount, thirdAccount};
    }

    describe("Deployment",function(){
        it("Should correctly set owner",async function(){
            const {myERC721Token, owner} = await loadFixture(delpoy);

            expect(await myERC721Token.owner()).to.equal(owner.address);
        })
    })

    describe("Mint",function(){
        it("Should owner mint NFT to otherAccount",async function(){
            const {myERC721Token, secondAccount} = await loadFixture(delpoy);
            const expectedBalance = 1;
            
            await myERC721Token.mint(secondAccount, "URI");

            expect(await myERC721Token.balanceOf(secondAccount.address)).to.equal(expectedBalance);
        });
        
        it("Should revert if not owner mint",async function(){
            const {myERC721Token, secondAccount} = await loadFixture(delpoy);

            await expect(myERC721Token.connect(secondAccount).mint(secondAccount, "URI")).to.be.revertedWithCustomError(myERC721Token, "NotOwner");
        });

        it("Should emit transfer on Mint",async function(){
            const {myERC721Token, secondAccount} = await loadFixture(delpoy);
            const expectedNFTid = 0;

            await expect(myERC721Token.mint(secondAccount, "URI"))
           .to.emit(myERC721Token, "Transfer")
           .withArgs(ethers.ZeroAddress, secondAccount, expectedNFTid);
        });
    })

    describe("Burn",function(){
        it("Should owner Burn NFT",async function(){
            const {myERC721Token, secondAccount} = await loadFixture(delpoyWithBalance);
            const expectedNFTid = 0;
            const expectedBalanceAfterBurn =  0;

            await myERC721Token.burn(expectedNFTid);

            expect(await myERC721Token.balanceOf(secondAccount.address)).to.equal(expectedBalanceAfterBurn);
        });
        
        it("Should revert if not owner Burn",async function(){
            const {myERC721Token, secondAccount} = await loadFixture(delpoyWithBalance);

            await expect(myERC721Token.connect(secondAccount).mint(secondAccount, "URI"))
            .to.be.revertedWithCustomError(myERC721Token, "NotOwner");
        });

        it("Should emit Transfer on Burn",async function(){
            const {myERC721Token, secondAccount} = await loadFixture(delpoyWithBalance);
            const expectedNFTid = 0;

            await expect(myERC721Token.burn(expectedNFTid))
            .to.emit(myERC721Token, "Transfer")
            .withArgs(secondAccount, ethers.ZeroAddress,  expectedNFTid);
        });
    })

    //this contract logic was writed by openzeppelin but I will practing wtiring test
    describe("Transfer",function(){
        it("Should owner Transfer NFT",async function(){
            const {myERC721Token, secondAccount, thirdAccount} = await loadFixture(delpoyWithBalance);
            const expectedNFTid = 0;
            const expectedBalanceAfterTranfer =  1;

            await myERC721Token.connect(secondAccount).transferFrom(secondAccount, thirdAccount, expectedNFTid);

            expect(await myERC721Token.balanceOf(secondAccount.address)).to.equal(expectedBalanceAfterTranfer - 1);
            expect(await myERC721Token.balanceOf(thirdAccount.address)).to.equal(expectedBalanceAfterTranfer);
        });
        
        it("Should revert if not owner Transfer",async function(){
            const {myERC721Token, secondAccount , thirdAccount} = await loadFixture(delpoyWithBalance);
            const expectedNFTid = 0;

            await expect(myERC721Token.connect(thirdAccount).transferFrom(secondAccount, thirdAccount, expectedNFTid))
            .to.be.revertedWithCustomError(myERC721Token, "ERC721InsufficientApproval");
        });

        it("Should emit on Transfer",async function(){
            const {myERC721Token, secondAccount, thirdAccount} = await loadFixture(delpoyWithBalance);
            const expectedNFTid = 0;
        

            await expect(myERC721Token.connect(secondAccount).transferFrom(secondAccount, thirdAccount, expectedNFTid))
            .to.emit(myERC721Token, "Transfer")
            .withArgs(secondAccount, thirdAccount,  expectedNFTid);
        });
    })

    describe("Approve",function(){
        it("Should approver Transfer NFT",async function(){
            const {myERC721Token, secondAccount, thirdAccount} = await loadFixture(delpoyWithBalance);
            const expectedNFTid = 0;
            const expectedBalanceAfterTranfer =  1;

            await myERC721Token.connect(secondAccount).approve(thirdAccount.address, expectedNFTid)
            await myERC721Token.connect(thirdAccount).transferFrom(secondAccount, thirdAccount, expectedNFTid);

            expect(await myERC721Token.balanceOf(secondAccount.address)).to.equal(expectedBalanceAfterTranfer - 1);
            expect(await myERC721Token.balanceOf(thirdAccount.address)).to.equal(expectedBalanceAfterTranfer);
        });
        
        it("Should revert if not owner disapprove prev approver",async function(){
            const {myERC721Token, secondAccount , thirdAccount} = await loadFixture(delpoyWithBalance);
            const expectedNFTid = 0;
            await myERC721Token.connect(secondAccount).approve(thirdAccount.address, expectedNFTid)
            await myERC721Token.connect(secondAccount).approve(ethers.ZeroAddress, expectedNFTid)

            await expect(myERC721Token.connect(thirdAccount).transferFrom(secondAccount, thirdAccount, expectedNFTid))
            .to.be.revertedWithCustomError(myERC721Token, "ERC721InsufficientApproval");
        });

        it("Should emit on Approve",async function(){
            const {myERC721Token, secondAccount, thirdAccount} = await loadFixture(delpoyWithBalance);
            const expectedNFTid = 0;
        

            await expect(myERC721Token.connect(secondAccount).approve(thirdAccount.address, expectedNFTid))
            .to.emit(myERC721Token, "Approval")
            .withArgs(secondAccount, thirdAccount,  expectedNFTid);
        });
    })
})