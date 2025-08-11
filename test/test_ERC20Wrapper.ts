import { expect } from "chai";
import { ethers } from "hardhat";
import { Signer } from "ethers";
import { PVMERC20 } from "../typechain-types/PVMERC20";
import { PVMERC20Wrapper } from "../typechain-types/PVMERC20Wrapper";
import { getWallets } from "./test_util";

describe("PVMERC20Wrapper", function () {
    let wrapper: PVMERC20Wrapper;
    let underlying: PVMERC20;
    let owner: Signer;
    let wallet1: Signer;
    let user: Signer;

    const name = "Wrapped Token";
    const symbol = "WTKN";
    const initialSupply = ethers.parseEther("10000");

    beforeEach(async function () {
        [owner, wallet1] = getWallets(2);
        user = ethers.Wallet.createRandom(ethers.getDefaultProvider());

        // Deploy a mock ERC20 as the underlying token
        const ERC20Factory = await ethers.getContractFactory("PVMERC20", owner);
        underlying = await ERC20Factory.deploy("Underlying", "UND", initialSupply);
        await underlying.waitForDeployment();

        // Deploy the wrapper contract
        const WrapperFactory = await ethers.getContractFactory("PVMERC20Wrapper");
        wrapper = await WrapperFactory.deploy(underlying.getAddress(), name, symbol);
        await wrapper.waitForDeployment();

        // Transfer some underlying tokens to user
        const txTransfer = await underlying.transfer(await wallet1.getAddress(), ethers.parseEther("1000"));
        await txTransfer.wait();
    });

    it("Should wrap (deposit) underlying tokens", async function () {
        const depositAmount = ethers.parseEther("100");
        const txApprove = await underlying.connect(wallet1).approve(wrapper.getAddress(), depositAmount);
        await txApprove.wait();

        const txDeposit = await wrapper.connect(wallet1).depositFor(await user.getAddress(), depositAmount);
        await txDeposit.wait();

        await expect(txDeposit)
            .to.emit(wrapper, "Transfer")
            .withArgs(ethers.ZeroAddress, await user.getAddress(), depositAmount);

        expect(await wrapper.balanceOf(await user.getAddress())).to.equal(depositAmount);
        expect(await underlying.balanceOf(await wrapper.getAddress())).to.equal(depositAmount);
    });

    it("Should unwrap (withdraw) wrapped tokens", async function () {
        const depositAmount = ethers.parseEther("100");

        const txApprove = await underlying.connect(owner).approve(wrapper.getAddress(), depositAmount);
        await txApprove.wait();

        const txDeposit = await wrapper.connect(owner).depositFor(await wallet1.getAddress(), depositAmount);
        await txDeposit.wait();

        const txWithdraw = await wrapper.connect(wallet1).withdrawTo(await owner.getAddress(), depositAmount);
        await txWithdraw.wait();

        expect(await wrapper.balanceOf(await wallet1.getAddress())).to.equal(0);
    });

    describe("Deployment and Configuration", function () {
        it("Should set correct wrapper token name and symbol", async function () {
            expect(await wrapper.name()).to.equal(name);
            expect(await wrapper.symbol()).to.equal(symbol);
        });

        it("Should correctly reference underlying token", async function () {
            expect(await wrapper.underlying()).to.equal(await underlying.getAddress());
        });

        it("Should inherit decimals from underlying token", async function () {
            const underlyingDecimals = await underlying.decimals();
            const wrapperDecimals = await wrapper.decimals();
            expect(wrapperDecimals).to.equal(underlyingDecimals);
        });
    });



    describe("Deposit Operations", function () {
        it("Should handle deposit to different account", async function () {
            const depositAmount = ethers.parseEther("250");

            const txApprove = await underlying.connect(wallet1).approve(await wrapper.getAddress(), depositAmount);
            await txApprove.wait();

            const txDeposit = await wrapper.connect(wallet1).depositFor(await user.getAddress(), depositAmount);
            await txDeposit.wait();

            // Depositor's underlying balance should decrease
            expect(await underlying.balanceOf(await wallet1.getAddress())).to.equal(ethers.parseEther("750"));
            // Recipient should get wrapped tokens
            expect(await wrapper.balanceOf(await user.getAddress())).to.equal(depositAmount);
            // Wrapper should hold underlying tokens
            expect(await underlying.balanceOf(await wrapper.getAddress())).to.equal(depositAmount);
        });

        it("Should revert when depositing without sufficient allowance", async function () {
            const depositAmount = ethers.parseEther("100");

            // No approval given
            await expect(
                wrapper.connect(wallet1).depositFor(await user.getAddress(), depositAmount)
            ).to.be.revertedWithCustomError(underlying, "ERC20InsufficientAllowance");
        });

        it("Should revert when depositing more than balance", async function () {
            const depositAmount = ethers.parseEther("2000"); // More than wallet1's balance

            const txApprove = await underlying.connect(wallet1).approve(await wrapper.getAddress(), depositAmount);
            await txApprove.wait();

            await expect(
                wrapper.connect(wallet1).depositFor(await user.getAddress(), depositAmount)
            ).to.be.revertedWithCustomError(underlying, "ERC20InsufficientBalance");
        });
    });

    describe("Withdraw Operations", function () {
        beforeEach(async function () {
            // Setup wrapped tokens for withdrawal tests
            const depositAmount = ethers.parseEther("500");
            const txApprove = await underlying.connect(wallet1).approve(await wrapper.getAddress(), depositAmount);
            await txApprove.wait();
            const txDeposit = await wrapper.connect(wallet1).depositFor(await wallet1.getAddress(), depositAmount);
            await txDeposit.wait();
        });

        it("Should handle withdraw to different account", async function () {
            const withdrawAmount = ethers.parseEther("200");
            const initialUserBalance = await underlying.balanceOf(await user.getAddress());

            const txWithdraw = await wrapper.connect(wallet1).withdrawTo(await user.getAddress(), withdrawAmount);
            await txWithdraw.wait();

            // Wrapper holder's balance should decrease
            expect(await wrapper.balanceOf(await wallet1.getAddress())).to.equal(ethers.parseEther("300"));
            // Recipient should receive underlying tokens
            expect(await underlying.balanceOf(await user.getAddress())).to.equal(initialUserBalance + withdrawAmount);
            // Wrapper contract's underlying balance should decrease
            expect(await underlying.balanceOf(await wrapper.getAddress())).to.equal(ethers.parseEther("300"));
        });

        it("Should revert when withdrawing more than wrapped balance", async function () {
            const withdrawAmount = ethers.parseEther("600"); // More than wallet1's wrapped balance

            await expect(
                wrapper.connect(wallet1).withdrawTo(await user.getAddress(), withdrawAmount)
            ).to.be.revertedWithCustomError(wrapper, "ERC20InsufficientBalance");
        });

        it("Should emit correct Transfer event on withdraw", async function () {
            const withdrawAmount = ethers.parseEther("150");

            const txWithdraw = await wrapper.connect(wallet1).withdrawTo(await user.getAddress(), withdrawAmount);
            await txWithdraw.wait();

            await expect(txWithdraw)
                .to.emit(wrapper, "Transfer")
                .withArgs(await wallet1.getAddress(), ethers.ZeroAddress, withdrawAmount);
        });
    });

    describe("Balance Consistency and Edge Cases", function () {
        it("Should maintain 1:1 ratio between wrapped and underlying tokens", async function () {
            const depositAmount = ethers.parseEther("300");

            const txApprove = await underlying.connect(wallet1).approve(await wrapper.getAddress(), depositAmount);
            await txApprove.wait();
            const txDeposit = await wrapper.connect(wallet1).depositFor(await wallet1.getAddress(), depositAmount);
            await txDeposit.wait();

            // Check 1:1 ratio
            expect(await wrapper.totalSupply()).to.equal(depositAmount);
            expect(await underlying.balanceOf(await wrapper.getAddress())).to.equal(depositAmount);
            expect(await wrapper.balanceOf(await wallet1.getAddress())).to.equal(depositAmount);
        });

        it("Should handle zero amount deposits and withdrawals", async function () {
            const txApprove = await underlying.connect(wallet1).approve(await wrapper.getAddress(), 0);
            await txApprove.wait();

            // Zero deposit should succeed but not change balances
            const txDeposit = await wrapper.connect(wallet1).depositFor(await user.getAddress(), 0);
            await txDeposit.wait();

            expect(await wrapper.balanceOf(await user.getAddress())).to.equal(0);
            expect(await underlying.balanceOf(await wrapper.getAddress())).to.equal(0);
        });

        it("Should correctly update total supply on deposits and withdrawals", async function () {
            const depositAmount = ethers.parseEther("400");

            // Initial total supply should be 0
            expect(await wrapper.totalSupply()).to.equal(0);

            // Deposit
            const txApprove = await underlying.connect(wallet1).approve(await wrapper.getAddress(), depositAmount);
            await txApprove.wait();
            const txDeposit = await wrapper.connect(wallet1).depositFor(await wallet1.getAddress(), depositAmount);
            await txDeposit.wait();

            expect(await wrapper.totalSupply()).to.equal(depositAmount);

            // Partial withdrawal
            const withdrawAmount = ethers.parseEther("150");
            const txWithdraw = await wrapper.connect(wallet1).withdrawTo(await user.getAddress(), withdrawAmount);
            await txWithdraw.wait();

            expect(await wrapper.totalSupply()).to.equal(depositAmount - withdrawAmount);
        });
    });
});