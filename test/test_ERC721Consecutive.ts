import { expect } from "chai";
import { ethers } from "hardhat";
import { PVMERC721Consecutive } from "../typechain-types/contracts/PVMERC721Consecutive";
import { Signer } from "ethers";
import { getWallets } from "./test_util";

describe("PVMERC721Consecutive", function () {
    let token: PVMERC721Consecutive;
    let owner: Signer;
    let wallet1: Signer;
    let wallet2: Signer;

    const name = "Consecutive NFT";
    const symbol = "CNFT";

    beforeEach(async function () {
        [owner, wallet1] = getWallets(2);

        wallet2 = ethers.Wallet.createRandom(ethers.getDefaultProvider());

        const ERC721ConsecutiveFactory = await ethers.getContractFactory("PVMERC721Consecutive", owner);
        token = await ERC721ConsecutiveFactory.deploy(name, symbol);
        await token.waitForDeployment();
    });

    describe("Deployment", function () {
        it("Should set the correct name and symbol", async function () {
            expect(await token.name()).to.equal(name);
            expect(await token.symbol()).to.equal(symbol);
        });

        it("Should set the deployer as owner", async function () {
            expect(await token.owner()).to.equal(await owner.getAddress());
        });

        it("Should start with next token ID as 1", async function () {
            expect(await token.nextTokenId()).to.equal(1);
        });

        it("Should start with total supply of 0", async function () {
            expect(await token.totalSupply()).to.equal(0);
        });
    });

    describe("Single Token Minting", function () {
        it("Should mint a single token correctly", async function () {
            try {
                const txMint = await token.connect(owner).mint(await wallet1.getAddress());
                await txMint.wait();
            } catch (error) {
                console.log(error);
            }

            expect(await token.ownerOf(1)).to.equal(await wallet1.getAddress());
            expect(await token.nextTokenId()).to.equal(2);
            expect(await token.totalSupply()).to.equal(1);
        });

        it("Should increment token ID after each mint", async function () {
            // Mint first token
            const txMint1 = await token.connect(owner).mint(await wallet1.getAddress());
            await txMint1.wait();
            expect(await token.nextTokenId()).to.equal(2);

            // Mint second token
            const txMint2 = await token.connect(owner).mint(await wallet2.getAddress());
            await txMint2.wait();
            expect(await token.nextTokenId()).to.equal(3);
            expect(await token.totalSupply()).to.equal(2);
        });

        it("Should revert when non-owner tries to mint", async function () {
            await expect(
                token.connect(wallet1).mint(await wallet2.getAddress())
            ).to.be.revertedWithCustomError(token, "OwnableUnauthorizedAccount");
        });

        it("Should revert when minting to zero address", async function () {
            await expect(
                token.connect(owner).mint(ethers.ZeroAddress)
            ).to.be.revertedWith("Cannot mint to zero address");
        });
    });

    describe("Consecutive Batch Minting", function () {
        it("Should mint consecutive tokens in batch", async function () {

            const batchSize = 5;
            const txMintBatch = await token.connect(owner).mintConsecutive(await wallet1.getAddress(), batchSize);
            await txMintBatch.wait();

            // Check that tokens 1-5 are owned by wallet1
            for (let i = 1; i <= batchSize; i++) {
                expect(await token.ownerOf(i)).to.equal(await wallet1.getAddress());
            }

            expect(await token.nextTokenId()).to.equal(batchSize + 1);
            expect(await token.totalSupply()).to.equal(batchSize);
        });

        it("Should handle large batch sizes", async function () {
            const batchSize = 100;
            const txMintBatch = await token.connect(owner).mintConsecutive(await wallet1.getAddress(), batchSize);
            await txMintBatch.wait();

            // Check first and last tokens
            expect(await token.ownerOf(1)).to.equal(await wallet1.getAddress());
            expect(await token.ownerOf(batchSize)).to.equal(await wallet1.getAddress());

            expect(await token.nextTokenId()).to.equal(batchSize + 1);
            expect(await token.totalSupply()).to.equal(batchSize);
        });

        it("Should revert when non-owner tries to mint batch", async function () {
            await expect(
                token.connect(wallet1).mintConsecutive(await wallet2.getAddress(), 5)
            ).to.be.revertedWithCustomError(token, "OwnableUnauthorizedAccount");
        });

        it("Should revert when batch size is zero", async function () {
            await expect(
                token.connect(owner).mintConsecutive(await wallet1.getAddress(), 0)
            ).to.be.revertedWith("Quantity must be greater than 0");
        });

        it("Should revert when minting batch to zero address", async function () {
            await expect(
                token.connect(owner).mintConsecutive(ethers.ZeroAddress, 5)
            ).to.be.revertedWith("Cannot mint to zero address");
        });
    });

    describe("Token ID Sequencing and Tracking", function () {
        it("Should maintain correct token ID sequence after mixed operations", async function () {
            // Mint single token
            const txMint1 = await token.connect(owner).mint(await wallet1.getAddress());
            await txMint1.wait();
            expect(await token.nextTokenId()).to.equal(2);

            // Mint batch
            const txMintBatch = await token.connect(owner).mintConsecutive(await wallet2.getAddress(), 3);
            await txMintBatch.wait();
            expect(await token.nextTokenId()).to.equal(5);

            // Mint another single token
            const txMint2 = await token.connect(owner).mint(await wallet1.getAddress());
            await txMint2.wait();
            expect(await token.nextTokenId()).to.equal(6);

            expect(await token.totalSupply()).to.equal(5);
        });

        it("Should track ownership correctly for consecutive tokens", async function () {
            const batchSize = 10;
            const txMintBatch = await token.connect(owner).mintConsecutive(await wallet1.getAddress(), batchSize);
            await txMintBatch.wait();

            // Check balance
            expect(await token.balanceOf(await wallet1.getAddress())).to.equal(batchSize);

            // Check individual token ownership
            for (let i = 1; i <= batchSize; i++) {
                expect(await token.ownerOf(i)).to.equal(await wallet1.getAddress());
            }
        });
    });

    describe("ERC721 Standard Compliance", function () {
        beforeEach(async function () {
            // Setup: mint some tokens for testing
            const txMintBatch = await token.connect(owner).mintConsecutive(await wallet1.getAddress(), 5);
            await txMintBatch.wait();
        });

        it("Should support ERC721 transfers", async function () {
            const txTransfer = await token.connect(wallet1).transferFrom(
                await wallet1.getAddress(),
                await wallet2.getAddress(),
                1
            );
            await txTransfer.wait();

            expect(await token.ownerOf(1)).to.equal(await wallet2.getAddress());
            expect(await token.balanceOf(await wallet1.getAddress())).to.equal(4);
            expect(await token.balanceOf(await wallet2.getAddress())).to.equal(1);
        });

        it("Should support ERC721 approvals", async function () {
            const txApprove = await token.connect(wallet1).approve(await wallet2.getAddress(), 1);
            await txApprove.wait();

            expect(await token.getApproved(1)).to.equal(await wallet2.getAddress());

            const txTransferFrom = await token.connect(wallet2).transferFrom(
                await wallet1.getAddress(),
                await wallet2.getAddress(),
                1
            );
            await txTransferFrom.wait();

            expect(await token.ownerOf(1)).to.equal(await wallet2.getAddress());
        });

        it("Should support safeTransferFrom", async function () {
            const txSafeTransfer = await token.connect(wallet1)["safeTransferFrom(address,address,uint256)"](
                await wallet1.getAddress(),
                await wallet2.getAddress(),
                1
            );
            await txSafeTransfer.wait();

            expect(await token.ownerOf(1)).to.equal(await wallet2.getAddress());
        });
    });

    describe("Access Control and Authorization", function () {
        it("Should allow only owner to mint", async function () {
            // Owner should be able to mint
            const txMint = await token.connect(owner).mint(await wallet1.getAddress());
            await txMint.wait();
            expect(await token.ownerOf(1)).to.equal(await wallet1.getAddress());

            // Non-owner should not be able to mint
            await expect(
                token.connect(wallet1).mint(await wallet2.getAddress())
            ).to.be.revertedWithCustomError(token, "OwnableUnauthorizedAccount");
        });

        it("Should allow only owner to mint consecutive batches", async function () {
            // Owner should be able to mint batch
            const txMintBatch = await token.connect(owner).mintConsecutive(await wallet1.getAddress(), 3);
            await txMintBatch.wait();
            expect(await token.balanceOf(await wallet1.getAddress())).to.equal(3);

            // Non-owner should not be able to mint batch
            await expect(
                token.connect(wallet1).mintConsecutive(await wallet2.getAddress(), 3)
            ).to.be.revertedWithCustomError(token, "OwnableUnauthorizedAccount");
        });
    });

    describe("Error Conditions and Edge Cases", function () {
        it("Should handle zero quantity in batch minting", async function () {
            await expect(
                token.connect(owner).mintConsecutive(await wallet1.getAddress(), 0)
            ).to.be.revertedWith("Quantity must be greater than 0");
        });

        it("Should handle minting to zero address in single mint", async function () {
            await expect(
                token.connect(owner).mint(ethers.ZeroAddress)
            ).to.be.revertedWith("Cannot mint to zero address");
        });

        it("Should handle minting to zero address in batch mint", async function () {
            await expect(
                token.connect(owner).mintConsecutive(ethers.ZeroAddress, 5)
            ).to.be.revertedWith("Cannot mint to zero address");
        });

        it("Should maintain state consistency after failed operations", async function () {
            const initialNextTokenId = await token.nextTokenId();
            const initialTotalSupply = await token.totalSupply();

            // Try to mint to zero address (should fail)
            await expect(
                token.connect(owner).mint(ethers.ZeroAddress)
            ).to.be.revertedWith("Cannot mint to zero address");

            // State should remain unchanged
            expect(await token.nextTokenId()).to.equal(initialNextTokenId);
            expect(await token.totalSupply()).to.equal(initialTotalSupply);
        });
    });

    describe("Complex Scenarios and Integration", function () {
        it("Should handle multiple batch operations", async function () {
            // First batch
            const txBatch1 = await token.connect(owner).mintConsecutive(await wallet1.getAddress(), 3);
            await txBatch1.wait();

            // Second batch
            const txBatch2 = await token.connect(owner).mintConsecutive(await wallet2.getAddress(), 2);
            await txBatch2.wait();

            // Check ownership
            expect(await token.ownerOf(1)).to.equal(await wallet1.getAddress());
            expect(await token.ownerOf(2)).to.equal(await wallet1.getAddress());
            expect(await token.ownerOf(3)).to.equal(await wallet1.getAddress());
            expect(await token.ownerOf(4)).to.equal(await wallet2.getAddress());
            expect(await token.ownerOf(5)).to.equal(await wallet2.getAddress());

            expect(await token.nextTokenId()).to.equal(6);
            expect(await token.totalSupply()).to.equal(5);
        });

        it("Should handle mixed single and batch minting", async function () {
            // Single mint
            const txMint1 = await token.connect(owner).mint(await wallet1.getAddress());
            await txMint1.wait();

            // Batch mint
            const txBatch = await token.connect(owner).mintConsecutive(await wallet2.getAddress(), 4);
            await txBatch.wait();

            // Another single mint
            const txMint2 = await token.connect(owner).mint(await wallet1.getAddress());
            await txMint2.wait();

            // Check token ownership
            expect(await token.ownerOf(1)).to.equal(await wallet1.getAddress());
            expect(await token.ownerOf(2)).to.equal(await wallet2.getAddress());
            expect(await token.ownerOf(3)).to.equal(await wallet2.getAddress());
            expect(await token.ownerOf(4)).to.equal(await wallet2.getAddress());
            expect(await token.ownerOf(5)).to.equal(await wallet2.getAddress());
            expect(await token.ownerOf(6)).to.equal(await wallet1.getAddress());

            expect(await token.nextTokenId()).to.equal(7);
            expect(await token.totalSupply()).to.equal(6);
        });

        it("Should handle token transfers after batch minting", async function () {
            // Mint batch
            const txBatch = await token.connect(owner).mintConsecutive(await wallet1.getAddress(), 5);
            await txBatch.wait();

            // Transfer some tokens
            const txTransfer1 = await token.connect(wallet1).transferFrom(
                await wallet1.getAddress(),
                await wallet2.getAddress(),
                2
            );
            await txTransfer1.wait();

            const txTransfer2 = await token.connect(wallet1).transferFrom(
                await wallet1.getAddress(),
                await wallet2.getAddress(),
                4
            );
            await txTransfer2.wait();

            // Check final ownership
            expect(await token.ownerOf(1)).to.equal(await wallet1.getAddress());
            expect(await token.ownerOf(2)).to.equal(await wallet2.getAddress());
            expect(await token.ownerOf(3)).to.equal(await wallet1.getAddress());
            expect(await token.ownerOf(4)).to.equal(await wallet2.getAddress());
            expect(await token.ownerOf(5)).to.equal(await wallet1.getAddress());

            expect(await token.balanceOf(await wallet1.getAddress())).to.equal(3);
            expect(await token.balanceOf(await wallet2.getAddress())).to.equal(2);
        });
    });
}); 