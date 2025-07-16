import { expect } from "chai";
import { ethers } from "hardhat";
import { Signer } from "ethers";

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
        [owner, wallet1] = await ethers.getSigners();
        wallet2 = ethers.Wallet.createRandom(ethers.getDefaultProvider());


        // Deploy underlying ERC721 token
        const UnderlyingFactory = await ethers.getContractFactory("PVMERC721");
        underlying = await UnderlyingFactory.deploy(underlyingName, underlyingSymbol);
        await underlying.waitForDeployment();

        // Deploy wrapper contract
        const WrapperFactory = await ethers.getContractFactory("PVMERC721Wrapper");
        try {
            wrapper = await WrapperFactory.deploy(
                await underlying.getAddress(),
                wrapperName,
                wrapperSymbol
            );
            await wrapper.waitForDeployment();
        } catch (error) {
            console.error(error);
        }

        // Mint some underlying tokens for testing
        await underlying.mint(await wallet1.getAddress(), 1);
        await underlying.mint(await wallet1.getAddress(), 2);
        await underlying.mint(await wallet2.getAddress(), 3);
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

    describe("Wrapping (Deposit)", function () {
        beforeEach(async function () {
            // Approve wrapper to transfer underlying tokens
            await underlying.connect(wallet1).setApprovalForAll(await wrapper.getAddress(), true);
        });

        it("Should allow depositing single token", async function () {
            const wallet1Address = await wallet1.getAddress();

            await wrapper.connect(wallet1).depositFor(wallet1Address, [1]);

            expect(await wrapper.ownerOf(1)).to.equal(wallet1Address);
            expect(await underlying.ownerOf(1)).to.equal(await wrapper.getAddress());
        });

        it("Should allow depositing multiple tokens", async function () {
            const wallet1Address = await wallet1.getAddress();

            await wrapper.connect(wallet1).depositFor(wallet1Address, [1, 2]);

            expect(await wrapper.ownerOf(1)).to.equal(wallet1Address);
            expect(await wrapper.ownerOf(2)).to.equal(wallet1Address);
            expect(await underlying.ownerOf(1)).to.equal(await wrapper.getAddress());
            expect(await underlying.ownerOf(2)).to.equal(await wrapper.getAddress());
        });

        it("Should allow depositing for another address", async function () {
            const wallet1Address = await wallet1.getAddress();
            const wallet2Address = await wallet2.getAddress();

            await wrapper.connect(wallet1).depositFor(wallet2Address, [1]);

            expect(await wrapper.ownerOf(1)).to.equal(wallet2Address);
            expect(await underlying.ownerOf(1)).to.equal(await wrapper.getAddress());
        });

        it("Should prevent depositing without approval", async function () {
            const wallet2Address = await wallet2.getAddress();

            await expect(
                wrapper.connect(wallet2).depositFor(wallet2Address, [3])
            ).to.be.reverted;
        });

        it("Should prevent depositing tokens not owned", async function () {
            const wallet1Address = await wallet1.getAddress();

            await expect(
                wrapper.connect(wallet1).depositFor(wallet1Address, [3])
            ).to.be.reverted;
        });

        it("Should prevent depositing to zero address", async function () {
            await expect(
                wrapper.connect(wallet1).depositFor(ethers.ZeroAddress, [1])
            ).to.be.reverted;
        });

        it("Should prevent depositing empty array", async function () {
            const wallet1Address = await wallet1.getAddress();

            await expect(
                wrapper.connect(wallet1).depositFor(wallet1Address, [])
            ).to.be.reverted;
        });
    });

    describe("Unwrapping (Withdraw)", function () {
        beforeEach(async function () {
            // Approve and deposit tokens
            await underlying.connect(wallet1).setApprovalForAll(await wrapper.getAddress(), true);
            await wrapper.connect(wallet1).depositFor(await wallet1.getAddress(), [1, 2]);
        });

        it("Should allow withdrawing single token", async function () {
            const wallet1Address = await wallet1.getAddress();

            await wrapper.connect(wallet1).withdrawTo(wallet1Address, [1]);

            expect(await underlying.ownerOf(1)).to.equal(wallet1Address);
            await expect(wrapper.ownerOf(1)).to.be.reverted;
        });

        it("Should allow withdrawing multiple tokens", async function () {
            const wallet1Address = await wallet1.getAddress();

            await wrapper.connect(wallet1).withdrawTo(wallet1Address, [1, 2]);

            expect(await underlying.ownerOf(1)).to.equal(wallet1Address);
            expect(await underlying.ownerOf(2)).to.equal(wallet1Address);
            await expect(wrapper.ownerOf(1)).to.be.reverted;
            await expect(wrapper.ownerOf(2)).to.be.reverted;
        });

        it("Should allow withdrawing to another address", async function () {
            const wallet1Address = await wallet1.getAddress();
            const wallet2Address = await wallet2.getAddress();

            await wrapper.connect(wallet1).withdrawTo(wallet2Address, [1]);

            expect(await underlying.ownerOf(1)).to.equal(wallet2Address);
            await expect(wrapper.ownerOf(1)).to.be.reverted;
        });

        it("Should prevent withdrawing tokens not owned", async function () {
            const wallet2Address = await wallet2.getAddress();

            await expect(
                wrapper.connect(wallet2).withdrawTo(wallet2Address, [1])
            ).to.be.reverted;
        });

        it("Should prevent withdrawing to zero address", async function () {
            await expect(
                wrapper.connect(wallet1).withdrawTo(ethers.ZeroAddress, [1])
            ).to.be.reverted;
        });

        it("Should prevent withdrawing empty array", async function () {
            const wallet1Address = await wallet1.getAddress();

            await expect(
                wrapper.connect(wallet1).withdrawTo(wallet1Address, [])
            ).to.be.reverted;
        });
    });

    describe("Standard ERC721 Functionality", function () {
        beforeEach(async function () {
            // Setup wrapped tokens
            await underlying.connect(wallet1).setApprovalForAll(await wrapper.getAddress(), true);
            await wrapper.connect(wallet1).depositFor(await wallet1.getAddress(), [1, 2]);
        });

        it("Should transfer wrapped tokens correctly", async function () {
            const wallet1Address = await wallet1.getAddress();
            const wallet2Address = await wallet2.getAddress();

            await wrapper.connect(wallet1).transferFrom(wallet1Address, wallet2Address, 1);
            expect(await wrapper.ownerOf(1)).to.equal(wallet2Address);
        });

        it("Should handle approvals correctly", async function () {
            const wallet1Address = await wallet1.getAddress();
            const wallet2Address = await wallet2.getAddress();

            await wrapper.connect(wallet1).approve(wallet2Address, 1);
            expect(await wrapper.getApproved(1)).to.equal(wallet2Address);
        });

        it("Should handle approval for all correctly", async function () {
            const wallet1Address = await wallet1.getAddress();
            const wallet2Address = await wallet2.getAddress();

            await wrapper.connect(wallet1).setApprovalForAll(wallet2Address, true);
            expect(await wrapper.isApprovedForAll(wallet1Address, wallet2Address)).to.be.true;
        });
    });

    describe("Token Existence", function () {
        beforeEach(async function () {
            await underlying.connect(wallet1).setApprovalForAll(await wrapper.getAddress(), true);
            await wrapper.connect(wallet1).depositFor(await wallet1.getAddress(), [1]);
        });

        it("Should return true for existing wrapped tokens", async function () {
            expect(await wrapper.exists(1)).to.be.true;
        });

        it("Should return false for non-existent wrapped tokens", async function () {
            expect(await wrapper.exists(999)).to.be.false;
        });

        it("Should return false for unwrapped tokens", async function () {
            expect(await wrapper.exists(2)).to.be.false;
        });
    });

    describe("Complex Scenarios", function () {
        beforeEach(async function () {
            await underlying.connect(wallet1).setApprovalForAll(await wrapper.getAddress(), true);
            await underlying.connect(wallet2).setApprovalForAll(await wrapper.getAddress(), true);
        });

        it("Should handle wrap -> transfer -> unwrap scenario", async function () {
            const wallet1Address = await wallet1.getAddress();
            const wallet2Address = await wallet2.getAddress();

            // Wrap token
            await wrapper.connect(wallet1).depositFor(wallet1Address, [1]);
            expect(await wrapper.ownerOf(1)).to.equal(wallet1Address);

            // Transfer wrapped token
            await wrapper.connect(wallet1).transferFrom(wallet1Address, wallet2Address, 1);
            expect(await wrapper.ownerOf(1)).to.equal(wallet2Address);

            // Unwrap token
            await wrapper.connect(wallet2).withdrawTo(wallet2Address, [1]);
            expect(await underlying.ownerOf(1)).to.equal(wallet2Address);
        });

        it("Should handle multiple users wrapping and unwrapping", async function () {
            const wallet1Address = await wallet1.getAddress();
            const wallet2Address = await wallet2.getAddress();

            // Both users wrap their tokens
            await wrapper.connect(wallet1).depositFor(wallet1Address, [1, 2]);
            await wrapper.connect(wallet2).depositFor(wallet2Address, [3]);

            expect(await wrapper.ownerOf(1)).to.equal(wallet1Address);
            expect(await wrapper.ownerOf(2)).to.equal(wallet1Address);
            expect(await wrapper.ownerOf(3)).to.equal(wallet2Address);

            // Users unwrap their tokens
            await wrapper.connect(wallet1).withdrawTo(wallet1Address, [1]);
            await wrapper.connect(wallet2).withdrawTo(wallet2Address, [3]);

            expect(await underlying.ownerOf(1)).to.equal(wallet1Address);
            expect(await underlying.ownerOf(3)).to.equal(wallet2Address);
            expect(await wrapper.ownerOf(2)).to.equal(wallet1Address); // Still wrapped
        });
    });
}); 