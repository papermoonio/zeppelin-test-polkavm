import { expect } from "chai";
import { ethers } from "hardhat";
import { PVMERC20FlashMint } from "../typechain-types/contracts/PVMERC20FlashMint";
import { Signer } from "ethers";

describe("PVMERC20FlashMint", function () {
    let token: PVMERC20FlashMint;
    let owner: Signer;
    let wallet1: Signer;
    let wallet2: Signer;

    const name = "Flash Token";
    const symbol = "FLASH";
    const initialSupply = ethers.parseEther("10000");

    before(async function () {
        [owner, wallet1] = await ethers.getSigners();
        wallet2 = ethers.Wallet.createRandom(ethers.getDefaultProvider());

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

        it("Should have flash loan fee of 0", async function () {
            expect(await token.flashFee(await token.getAddress(), ethers.parseEther("1000"))).to.equal(0);
        });
    });

    describe("Flash Loan Basic Functionality", function () {
        it("Should execute simple flash loan", async function () {
            const flashAmount = ethers.parseEther("1");
            const borrowerFactory = await ethers.getContractFactory("PVMERC3156FlashBorrower");
            const borrower = await borrowerFactory.deploy();
            await borrower.waitForDeployment();

            const tokenAddress = await token.getAddress();
            const borrowerAddress = await borrower.getAddress();
            // Execute flash loan
            try {
                await token.flashLoan(borrowerAddress, tokenAddress, flashAmount, "0x00");
            } catch (error) {
                console.log("error", error);
            }

            console.log("borrower balance", await token.balanceOf(borrowerAddress));

            // Check that borrower received and returned tokens
            expect(await token.balanceOf(borrowerAddress)).to.equal(flashAmount);
        });

        it("Should handle flash loan with custom data", async function () {
            const flashAmount = ethers.parseEther("250");
            const customData = ethers.toUtf8Bytes("test data");

            const borrowerFactory = await ethers.getContractFactory("PVMERC3156FlashBorrower");
            const borrower = await borrowerFactory.deploy();
            await borrower.waitForDeployment();

            await token.flashLoan(await borrower.getAddress(), await token.getAddress(), flashAmount, customData);
        });
    });

    describe("Flash Loan Error Cases", function () {

        it("Should fail when token address is invalid", async function () {
            const flashAmount = ethers.parseEther("1000");
            const borrowerFactory = await ethers.getContractFactory("PVMERC3156FlashBorrower");
            const borrower = await borrowerFactory.deploy();
            await borrower.waitForDeployment();

            await expect(
                token.flashLoan(await borrower.getAddress(), await wallet1.getAddress(), flashAmount, "0x")
            ).to.be.reverted;
        });

        it("Should fail when borrower doesn't implement interface", async function () {
            const flashAmount = ethers.parseEther("1000");

            await expect(
                token.flashLoan(await wallet1.getAddress(), await token.getAddress(), flashAmount, "0x")
            ).to.be.reverted;
        });
    });

    describe("Flash Loan Advanced Scenarios", function () {
        it("Should handle multiple consecutive flash loans", async function () {
            const flashAmount = ethers.parseEther("100");
            const borrowerFactory = await ethers.getContractFactory("PVMERC3156FlashBorrower");
            const borrower = await borrowerFactory.deploy();
            await borrower.waitForDeployment();

            const tokenAddress = await token.getAddress();
            const borrowerAddress = await borrower.getAddress();

            // Execute multiple flash loans
            await token.flashLoan(borrowerAddress, tokenAddress, flashAmount, "0x");
            await token.flashLoan(borrowerAddress, tokenAddress, flashAmount, "0x");
            await token.flashLoan(borrowerAddress, tokenAddress, flashAmount, "0x");

            expect(await token.balanceOf(borrowerAddress)).to.equal(flashAmount + flashAmount + flashAmount);
        });

        it("Should handle arbitrage scenario", async function () {
            const flashAmount = ethers.parseEther("1000");
            const arbitrageBorrowerFactory = await ethers.getContractFactory("PVMERC3156FlashBorrower");
            const arbitrageBorrower = await arbitrageBorrowerFactory.deploy();
            await arbitrageBorrower.waitForDeployment();

            // Fund the arbitrage contract with some tokens for profit
            await token.transfer(await arbitrageBorrower.getAddress(), ethers.parseEther("50"));

            const initialBalance = await token.balanceOf(await arbitrageBorrower.getAddress());

            await token.flashLoan(
                await arbitrageBorrower.getAddress(),
                await token.getAddress(),
                flashAmount,
                "0x"
            );

        });
    });

    describe("Standard ERC20 Functionality", function () {
        it("Should transfer tokens correctly", async function () {
            const amount = ethers.parseEther("100");
            const balance = await token.balanceOf(await owner.getAddress());
            await token.transfer(await wallet1.getAddress(), amount);

            expect(await token.balanceOf(await wallet1.getAddress())).to.equal(amount);
            expect(await token.balanceOf(await owner.getAddress())).to.equal(balance - amount);
        });

        it("Should approve and transferFrom correctly", async function () {
            const amount = ethers.parseEther("50");
            await token.approve(await wallet1.getAddress(), amount);

            await token.connect(wallet1).transferFrom(
                await owner.getAddress(),
                await wallet2.getAddress(),
                amount
            );

            expect(await token.balanceOf(await wallet2.getAddress())).to.equal(amount);
            expect(await token.allowance(await owner.getAddress(), await wallet1.getAddress())).to.equal(0);
        });
    });
});
