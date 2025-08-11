import { expect } from "chai";
import { ethers } from "hardhat";
import { Signer } from "ethers";
import { getWallets } from "./test_util";

describe("PVMERC721Wrapper", function () {
    let wrapper: any;
    let underlying: any;
    let owner: Signer;
    let wallet1: Signer;
    let wallet2: Signer;

    const underlyingName = "Underlying NFT";
    const underlyingSymbol = "UNFT";
    const wrapperName = "Wrapped NFT";
    const wrapperSymbol = "WNFT";

    beforeEach(async function () {
        [owner, wallet1] = getWallets(2);
        wallet2 = ethers.Wallet.createRandom(ethers.getDefaultProvider());

        // Deploy underlying ERC721 token
        const UnderlyingFactory = await ethers.getContractFactory("PVMERC721", owner);
        underlying = await UnderlyingFactory.deploy(underlyingName, underlyingSymbol);
        await underlying.waitForDeployment();

        // Deploy wrapper contract
        const WrapperFactory = await ethers.getContractFactory("PVMERC721Wrapper", owner);
        wrapper = await WrapperFactory.deploy(
            await underlying.getAddress(),
            wrapperName,
            wrapperSymbol
        );
        await wrapper.waitForDeployment();

        // Mint some underlying tokens for testing
        const txMint1 = await underlying.mint(await wallet1.getAddress(), 1);
        await txMint1.wait();
        const txMint2 = await underlying.mint(await wallet1.getAddress(), 2);
        await txMint2.wait();
        const txMint3 = await underlying.mint(await wallet2.getAddress(), 3);
        await txMint3.wait();
    });

    describe("Deployment", function () {
        it("Should set the correct name and symbol", async function () {
            expect(await wrapper.name()).to.equal(wrapperName);
            expect(await wrapper.symbol()).to.equal(wrapperSymbol);
        });

        it("Should set the correct underlying token", async function () {
            expect(await wrapper.underlying()).to.equal(await underlying.getAddress());
        });

        it("Should set the deployer as owner", async function () {
            expect(await wrapper.owner()).to.equal(await owner.getAddress());
        });
    });

    describe("Token Wrapping - Single Token", function () {
        it("Should deposit a single token successfully", async function () {
            // Approve wrapper to transfer token
            const txApprove = await underlying.connect(wallet1).approve(await wrapper.getAddress(), 1);
            await txApprove.wait();

            // Deposit token
            const txDeposit = await wrapper.connect(wallet1).depositFor(await wallet1.getAddress(), [1]);
            await txDeposit.wait();

            // Check wrapper has the wrapped token
            expect(await wrapper.ownerOf(1)).to.equal(await wallet1.getAddress());
            // Check wrapper contract owns the underlying token
            expect(await underlying.ownerOf(1)).to.equal(await wrapper.getAddress());
            // Check balance
            expect(await wrapper.balanceOf(await wallet1.getAddress())).to.equal(1);
        });

        it("Should withdraw a single token successfully", async function () {
            // First deposit
            const txApprove = await underlying.connect(wallet1).approve(await wrapper.getAddress(), 1);
            await txApprove.wait();
            const txDeposit = await wrapper.connect(wallet1).depositFor(await wallet1.getAddress(), [1]);
            await txDeposit.wait();

            // Then withdraw
            const txWithdraw = await wrapper.connect(wallet1).withdrawTo(await wallet1.getAddress(), [1]);
            await txWithdraw.wait();

            // Check wallet1 has the underlying token back
            expect(await underlying.ownerOf(1)).to.equal(await wallet1.getAddress());
            // Check wrapper balance is 0
            expect(await wrapper.balanceOf(await wallet1.getAddress())).to.equal(0);
        });
    });

    describe("Token Wrapping - Multiple Tokens", function () {
        it("Should deposit multiple tokens in one transaction", async function () {
            // Approve wrapper for both tokens
            const txApprove1 = await underlying.connect(wallet1).approve(await wrapper.getAddress(), 1);
            await txApprove1.wait();
            const txApprove2 = await underlying.connect(wallet1).approve(await wrapper.getAddress(), 2);
            await txApprove2.wait();

            // Deposit both tokens
            const txDeposit = await wrapper.connect(wallet1).depositFor(await wallet1.getAddress(), [1, 2]);
            await txDeposit.wait();

            // Check both tokens are wrapped
            expect(await wrapper.ownerOf(1)).to.equal(await wallet1.getAddress());
            expect(await wrapper.ownerOf(2)).to.equal(await wallet1.getAddress());
            expect(await wrapper.balanceOf(await wallet1.getAddress())).to.equal(2);
        });

        it("Should withdraw multiple tokens in one transaction", async function () {
            // Setup: deposit tokens first
            const txApprove1 = await underlying.connect(wallet1).approve(await wrapper.getAddress(), 1);
            await txApprove1.wait();
            const txApprove2 = await underlying.connect(wallet1).approve(await wrapper.getAddress(), 2);
            await txApprove2.wait();
            const txDeposit = await wrapper.connect(wallet1).depositFor(await wallet1.getAddress(), [1, 2]);
            await txDeposit.wait();

            // Withdraw both tokens
            const txWithdraw = await wrapper.connect(wallet1).withdrawTo(await wallet1.getAddress(), [1, 2]);
            await txWithdraw.wait();

            // Check tokens are back with original owner
            expect(await underlying.ownerOf(1)).to.equal(await wallet1.getAddress());
            expect(await underlying.ownerOf(2)).to.equal(await wallet1.getAddress());
            expect(await wrapper.balanceOf(await wallet1.getAddress())).to.equal(0);
        });
    });

    describe("Direct Transfer and onERC721Received", function () {
        it("Should automatically wrap tokens sent directly to contract", async function () {
            // Direct transfer using safeTransferFrom
            const txTransfer = await underlying.connect(wallet1)["safeTransferFrom(address,address,uint256)"](
                await wallet1.getAddress(),
                await wrapper.getAddress(),
                1
            );
            await txTransfer.wait();
            // Should automatically mint wrapped token to sender
            expect(await wrapper.ownerOf(1)).to.equal(await wallet1.getAddress());
            expect(await underlying.ownerOf(1)).to.equal(await wrapper.getAddress());
        });

        it("Should reject tokens from unsupported contracts", async function () {
            // Deploy another ERC721 contract
            const AnotherFactory = await ethers.getContractFactory("PVMERC721", owner);
            const anotherToken = await AnotherFactory.deploy("Another NFT", "ANFT");
            await anotherToken.waitForDeployment();

            // Mint token
            const txMint = await anotherToken.mint(await wallet1.getAddress(), 1);
            await txMint.wait();

            // Try to send to wrapper - should revert
            await expect(
                anotherToken.connect(wallet1)["safeTransferFrom(address,address,uint256)"](
                    await wallet1.getAddress(),
                    await wrapper.getAddress(),
                    1
                )
            ).to.be.revertedWithCustomError(wrapper, "ERC721UnsupportedToken");
        });
    });

    describe("Ownership and Access Control", function () {
        it("Should allow deposit to different account", async function () {
            const txApprove = await underlying.connect(wallet1).approve(await wrapper.getAddress(), 1);
            await txApprove.wait();

            // Deposit to wallet2's address
            const txDeposit = await wrapper.connect(wallet1).depositFor(await wallet2.getAddress(), [1]);
            await txDeposit.wait();

            expect(await wrapper.ownerOf(1)).to.equal(await wallet2.getAddress());
        });

        it("Should allow withdraw to different account", async function () {
            // Setup: deposit token
            const txApprove = await underlying.connect(wallet1).approve(await wrapper.getAddress(), 1);
            await txApprove.wait();
            const txDeposit = await wrapper.connect(wallet1).depositFor(await wallet1.getAddress(), [1]);
            await txDeposit.wait();

            // Withdraw to wallet2
            const txWithdraw = await wrapper.connect(wallet1).withdrawTo(await wallet2.getAddress(), [1]);
            await txWithdraw.wait();

            expect(await underlying.ownerOf(1)).to.equal(await wallet2.getAddress());
        });

        it("Should maintain Ownable functionality", async function () {
            expect(await wrapper.owner()).to.equal(await owner.getAddress());

            // Only owner should be able to transfer ownership
            await expect(
                wrapper.connect(wallet1).transferOwnership(await wallet1.getAddress())
            ).to.be.revertedWithCustomError(wrapper, "OwnableUnauthorizedAccount");
        });
    });

    describe("ERC721 Standard Compliance", function () {
        beforeEach(async function () {
            // Setup wrapped tokens for testing
            const txApprove = await underlying.connect(wallet1).approve(await wrapper.getAddress(), 1);
            await txApprove.wait();
            const txDeposit = await wrapper.connect(wallet1).depositFor(await wallet1.getAddress(), [1]);
            await txDeposit.wait();
        });

        it("Should support ERC721 transfers", async function () {
            // Transfer wrapped token
            const txTransfer = await wrapper.connect(wallet1).transferFrom(
                await wallet1.getAddress(),
                await wallet2.getAddress(),
                1
            );
            await txTransfer.wait();
            expect(await wrapper.ownerOf(1)).to.equal(await wallet2.getAddress());
        });
    });

    describe("Error Conditions", function () {

        it("Should revert when depositing without approval", async function () {
            await expect(
                wrapper.connect(wallet1).depositFor(await wallet1.getAddress(), [1])
            ).to.be.revertedWithCustomError(underlying, "ERC721InsufficientApproval");
        });

        it("Should revert when depositing non-existent token", async function () {
            await expect(
                wrapper.connect(wallet1).depositFor(await wallet1.getAddress(), [999])
            ).to.be.revertedWithCustomError(underlying, "ERC721NonexistentToken");
        });
    });

    describe("Gas Optimization and Batch Operations", function () {
        it("Should handle large batch operations efficiently", async function () {
            // Mint more tokens for testing
            const tokenIds = [4, 5, 6, 7, 8];
            for (const tokenId of tokenIds) {
                const txMint = await underlying.mint(await wallet1.getAddress(), tokenId);
                await txMint.wait();
                const txApprove = await underlying.connect(wallet1).approve(await wrapper.getAddress(), tokenId);
                await txApprove.wait();
            }

            // Batch deposit
            const tx = await wrapper.connect(wallet1).depositFor(await wallet1.getAddress(), tokenIds);
            await tx.wait();

            // Verify all tokens are wrapped
            for (const tokenId of tokenIds) {
                expect(await wrapper.ownerOf(tokenId)).to.equal(await wallet1.getAddress());
            }

            expect(await wrapper.balanceOf(await wallet1.getAddress())).to.equal(tokenIds.length);
        });
    });
});