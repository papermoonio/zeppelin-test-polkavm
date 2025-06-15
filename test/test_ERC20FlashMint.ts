import { expect } from "chai";
import { ethers } from "hardhat";
import { PVMERC20FlashMint } from "../typechain-types/contracts/PVMERC20FlashMint";
import { Signer } from "ethers";

describe("PVMERC20FlashMint", function () {
    let token: PVMERC20FlashMint;
    let owner: Signer;
    let wallet1: Signer;
    let wallet2: Signer;

    const name = "Test Token";
    const symbol = "TST";
    const initialSupply = ethers.parseEther("10000");

    before(async function () {
        [owner, wallet1] = await ethers.getSigners();

        const ERC20FlashMintFactory = await ethers.getContractFactory("PVMERC20FlashMint");
        token = await ERC20FlashMintFactory.deploy(name, symbol, initialSupply);
        await token.waitForDeployment();
    });

    describe("Deployment", function () {
        it("Should set the correct name and symbol", async function () {
            expect(await token.name()).to.equal(name);
            expect(await token.symbol()).to.equal(symbol);
        });

        it("Should assign the total supply to the owner", async function () {
            const ownerBalance = await token.balanceOf(await owner.getAddress());
            expect(await token.totalSupply()).to.equal(ownerBalance);
            expect(ownerBalance).to.equal(initialSupply);
        });
    });

    describe("Flash Loan", function () {
        let flashMinter: any;
        let badFlashMinter: any;
        it("Should execute flash loan successfully", async function () {
            const flashAmount = ethers.parseEther("1000");
            const initialBalance = await token.balanceOf(await flashMinter.getAddress());

            await flashMinter.flashMint(flashAmount);

            const finalBalance = await token.balanceOf(await flashMinter.getAddress());
            expect(finalBalance).to.equal(initialBalance);
        });

        it("Should fail when callback doesn't return tokens", async function () {
            const flashAmount = ethers.parseEther("1000");
            await expect(badFlashMinter.flashMint(flashAmount)).to.be.reverted;
        });

        it("Should fail when trying to flash loan more than available", async function () {
            const flashAmount = initialSupply + ethers.parseEther("1");
            await expect(flashMinter.flashMint(flashAmount)).to.be.reverted;
        });

        it("Should fail when trying to flash loan to non-contract address", async function () {
            const flashAmount = ethers.parseEther("1000");
            const wallet1Address = await wallet1.getAddress();
            await expect(token.flashLoan(wallet1Address, await token.getAddress(), flashAmount, "0x")).to.be.reverted;
        });

        // it("Should fail when trying to flash loan with invalid token", async function () {
        //     const flashAmount = ethers.parseEther("1000");
        //     const invalidToken = await wallet2.getAddress();
        //     await expect(token.flashLoan(await flashMinter.getAddress(), invalidToken, flashAmount, "0x")).to.be.reverted;
        // });

        it("Should emit FlashLoan event on successful flash loan", async function () {
            const flashAmount = ethers.parseEther("1000");
            const flashMinterAddress = await flashMinter.getAddress();
            const tokenAddress = await token.getAddress();

            await expect(flashMinter.flashMint(flashAmount))
                .to.emit(token, "FlashLoan")
                .withArgs(flashMinterAddress, tokenAddress, flashAmount, 0);
        });
    });


}); 