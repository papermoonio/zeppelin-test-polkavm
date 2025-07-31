import { expect } from "chai";
import { ethers } from "hardhat";
import { PVMERC721Consecutive } from "../typechain-types/contracts/PVMERC721Consecutive";
import { Signer } from "ethers";

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


        const ERC721ConsecutiveFactory = await ethers.getContractFactory("PVMERC721Consecutive");
        try {
            token = await ERC721ConsecutiveFactory.deploy(name, symbol);
            await token.waitForDeployment();
        } catch (error) {
            console.error(error);
        }
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

    describe("Single Minting", function () {
        it("Should allow owner to mint single token", async function () {
            const wallet1Address = await wallet1.getAddress();

            await token.mint(wallet1Address);

            expect(await token.ownerOf(1)).to.equal(wallet1Address);
            expect(await token.balanceOf(wallet1Address)).to.equal(1);
            expect(await token.totalSupply()).to.equal(1);
            expect(await token.nextTokenId()).to.equal(2);
        });

        it("Should prevent non-owner from minting", async function () {
            const wallet2Address = await wallet2.getAddress();

            await expect(
                token.connect(wallet1).mint(wallet2Address)
            ).to.be.reverted;
        });

        it("Should prevent minting to zero address", async function () {
            await expect(
                token.mint(ethers.ZeroAddress)
            ).to.be.reverted;
        });
    });

    describe("Consecutive Minting", function () {
        it("Should mint consecutive tokens to single address", async function () {
            const wallet1Address = await wallet1.getAddress();
            const quantity = 5;

            await expect(token.mintConsecutive(wallet1Address, quantity))
                .to.emit(token, "ConsecutiveTransfer")
                .withArgs(1, 5, ethers.ZeroAddress, wallet1Address);

            expect(await token.balanceOf(wallet1Address)).to.equal(quantity);
            expect(await token.totalSupply()).to.equal(quantity);

            // Check that all tokens are owned by wallet1
            for (let i = 1; i <= quantity; i++) {
                expect(await token.ownerOf(i)).to.equal(wallet1Address);
            }
        });

        it("Should mint consecutive tokens in batches", async function () {
            const wallet1Address = await wallet1.getAddress();
            const wallet2Address = await wallet2.getAddress();

            // First batch
            await token.mintConsecutive(wallet1Address, 3);
            expect(await token.balanceOf(wallet1Address)).to.equal(3);
            expect(await token.ownerOf(1)).to.equal(wallet1Address);
            expect(await token.ownerOf(3)).to.equal(wallet1Address);

            // Second batch
            await token.mintConsecutive(wallet2Address, 2);
            expect(await token.balanceOf(wallet2Address)).to.equal(2);
            expect(await token.ownerOf(4)).to.equal(wallet2Address);
            expect(await token.ownerOf(5)).to.equal(wallet2Address);

            expect(await token.totalSupply()).to.equal(5);
        });

        it("Should prevent non-owner from consecutive minting", async function () {
            const wallet2Address = await wallet2.getAddress();

            await expect(
                token.connect(wallet1).mintConsecutive(wallet2Address, 5)
            ).to.be.reverted;
        });

        it("Should prevent consecutive minting to zero address", async function () {
            await expect(
                token.mintConsecutive(ethers.ZeroAddress, 5)
            ).to.be.reverted;
        });

        it("Should prevent consecutive minting with zero quantity", async function () {
            const wallet1Address = await wallet1.getAddress();

            await expect(
                token.mintConsecutive(wallet1Address, 0)
            ).to.be.reverted;
        });

        it("Should handle large consecutive mint", async function () {
            const wallet1Address = await wallet1.getAddress();
            const quantity = 100;

            await token.mintConsecutive(wallet1Address, quantity);

            expect(await token.balanceOf(wallet1Address)).to.equal(quantity);
            expect(await token.totalSupply()).to.equal(quantity);
            expect(await token.ownerOf(1)).to.equal(wallet1Address);
            expect(await token.ownerOf(100)).to.equal(wallet1Address);
        });
    });

    describe("Mixed Minting", function () {
        it("Should handle mix of single and consecutive minting", async function () {
            const wallet1Address = await wallet1.getAddress();
            const wallet2Address = await wallet2.getAddress();

            // Single mint
            await token.mint(wallet1Address);
            expect(await token.ownerOf(1)).to.equal(wallet1Address);

            // Consecutive mint
            await token.mintConsecutive(wallet2Address, 3);
            expect(await token.ownerOf(2)).to.equal(wallet2Address);
            expect(await token.ownerOf(4)).to.equal(wallet2Address);

            // Another single mint
            await token.mint(wallet1Address);
            expect(await token.ownerOf(5)).to.equal(wallet1Address);

            expect(await token.totalSupply()).to.equal(5);
            expect(await token.balanceOf(wallet1Address)).to.equal(2);
            expect(await token.balanceOf(wallet2Address)).to.equal(3);
        });
    });

    describe("Standard ERC721 Functionality", function () {
        beforeEach(async function () {
            const wallet1Address = await wallet1.getAddress();
            await token.mintConsecutive(wallet1Address, 5);
        });

        it("Should transfer tokens correctly", async function () {
            const wallet1Address = await wallet1.getAddress();
            const wallet2Address = await wallet2.getAddress();

            await token.connect(wallet1).transferFrom(wallet1Address, wallet2Address, 3);

            expect(await token.ownerOf(3)).to.equal(wallet2Address);
            expect(await token.balanceOf(wallet1Address)).to.equal(4);
            expect(await token.balanceOf(wallet2Address)).to.equal(1);
        });

        it("Should handle approvals correctly", async function () {
            const wallet1Address = await wallet1.getAddress();
            const wallet2Address = await wallet2.getAddress();

            await token.connect(wallet1).approve(wallet2Address, 2);
            expect(await token.getApproved(2)).to.equal(wallet2Address);

            await token.connect(wallet2).transferFrom(wallet1Address, wallet2Address, 2);
            expect(await token.ownerOf(2)).to.equal(wallet2Address);
        });

        it("Should handle approval for all correctly", async function () {
            const wallet1Address = await wallet1.getAddress();
            const wallet2Address = await wallet2.getAddress();

            await token.connect(wallet1).setApprovalForAll(wallet2Address, true);
            expect(await token.isApprovedForAll(wallet1Address, wallet2Address)).to.be.true;

            await token.connect(wallet2).transferFrom(wallet1Address, wallet2Address, 1);
            expect(await token.ownerOf(1)).to.equal(wallet2Address);
        });
    });

    describe("Owner Functions", function () {
        it("Should allow owner to transfer ownership", async function () {
            const wallet1Address = await wallet1.getAddress();

            await token.connect(owner).transferOwnership(wallet1Address);
            expect(await token.owner()).to.equal(wallet1Address);
        });

        it("Should prevent non-owner from transferring ownership", async function () {
            const wallet2Address = await wallet2.getAddress();

            await expect(
                token.connect(wallet1).transferOwnership(wallet2Address)
            ).to.be.reverted;
        });
    });
}); 