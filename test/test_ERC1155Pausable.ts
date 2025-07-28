import { expect } from "chai";
import { ethers } from "hardhat";
import { PVMERC1155Pausable } from "../typechain-types/contracts/PVMERC1155Pausable";
import { Signer } from "ethers";

describe("PVMERC1155Pausable", function () {
    let token: PVMERC1155Pausable;
    let owner: Signer;
    let wallet1: Signer;
    let wallet2: Signer;

    const uri = "https://api.example.com/metadata/{id}.json";

    beforeEach(async function () {
        [owner, wallet1] = await ethers.getSigners();
        wallet2 = ethers.Wallet.createRandom(ethers.getDefaultProvider());

        try {
            const ERC1155PausableFactory = await ethers.getContractFactory("PVMERC1155Pausable");
            token = await ERC1155PausableFactory.deploy(uri);
            await token.waitForDeployment();
        } catch (error) {
            console.error(error);
        }

        // Mint some tokens for testing
        const wallet1Address = await wallet1.getAddress();
        const wallet2Address = await wallet2.getAddress();
        await token.mint(wallet1Address, 1, 1000, "0x");
        await token.mint(wallet2Address, 2, 500, "0x");
        await token.mintBatch(wallet1Address, [3, 4], [300, 200], "0x");
    });

    describe("Deployment", function () {
        it("Should set the correct URI", async function () {
            expect(await token.uri(1)).to.equal(uri);
        });

        it("Should set the deployer as owner", async function () {
            expect(await token.owner()).to.equal(await owner.getAddress());
        });

        it("Should start unpaused", async function () {
            expect(await token.paused()).to.be.false;
        });
    });

    describe("Pause/Unpause Functions", function () {
        it("Should allow owner to pause the contract", async function () {
            await token.pause();
            expect(await token.paused()).to.be.true;
        });

        it("Should allow owner to unpause the contract", async function () {
            await token.pause();
            await token.unpause();
            expect(await token.paused()).to.be.false;
        });

        it("Should prevent non-owner from pausing", async function () {
            await expect(
                token.connect(wallet1).pause(),
            ).to.be.reverted;
        });

        it("Should prevent non-owner from unpausing", async function () {
            await token.pause();
            await expect(
                token.connect(wallet1).unpause(),
            ).to.be.reverted;
        });

        it("Should emit Paused event when pausing", async function () {
            await expect(token.pause())
                .to.emit(token, "Paused")
                .withArgs(await owner.getAddress());
        });

        it("Should emit Unpaused event when unpausing", async function () {
            await token.pause();
            await expect(token.unpause())
                .to.emit(token, "Unpaused")
                .withArgs(await owner.getAddress());
        });
    });

    describe("Minting When Paused", function () {
        beforeEach(async function () {
            await token.pause();
        });

        it("Should prevent minting when paused", async function () {
            const wallet1Address = await wallet1.getAddress();
            await expect(
                token.mint(wallet1Address, 5, 100, "0x"),
            ).to.be.reverted;
        });

        it("Should prevent batch minting when paused", async function () {
            const wallet1Address = await wallet1.getAddress();
            await expect(
                token.mintBatch(wallet1Address, [5, 6], [100, 200], "0x"),
            ).to.be.reverted;
        });

        it("Should allow minting after unpausing", async function () {
            await token.unpause();
            const wallet1Address = await wallet1.getAddress();

            await token.mint(wallet1Address, 5, 100, "0x");
            expect(await token.balanceOf(wallet1Address, 5)).to.equal(100);
        });
    });

    describe("Burning When Paused", function () {
        beforeEach(async function () {
            await token.pause();
        });

        it("Should prevent burning when paused", async function () {
            const wallet1Address = await wallet1.getAddress();
            await expect(
                token.burn(wallet1Address, 1, 100),
            ).to.be.reverted;
        });

        it("Should prevent batch burning when paused", async function () {
            const wallet1Address = await wallet1.getAddress();
            await expect(
                token.burnBatch(wallet1Address, [3, 4], [50, 25]),
            ).to.be.reverted;
        });

        it("Should allow burning after unpausing", async function () {
            await token.unpause();
            const wallet1Address = await wallet1.getAddress();
            const initialBalance = await token.balanceOf(wallet1Address, 1);

            await token.burn(wallet1Address, 1, 100);
            expect(await token.balanceOf(wallet1Address, 1)).to.equal(initialBalance - 100n);
        });
    });

    describe("Transfers When Paused", function () {
        beforeEach(async function () {
            await token.pause();
        });

        it("Should prevent transfers when paused", async function () {
            const wallet1Address = await wallet1.getAddress();
            const wallet2Address = await wallet2.getAddress();

            await expect(
                token.connect(wallet1).safeTransferFrom(
                    wallet1Address,
                    wallet2Address,
                    1,
                    100,
                    "0x"
                ),
            ).to.be.reverted;
        });

        it("Should prevent batch transfers when paused", async function () {
            const wallet1Address = await wallet1.getAddress();
            const wallet2Address = await wallet2.getAddress();

            await expect(
                token.connect(wallet1).safeBatchTransferFrom(
                    wallet1Address,
                    wallet2Address,
                    [3, 4],
                    [50, 25],
                    "0x"
                ),
            ).to.be.reverted;
        });

        it("Should allow transfers after unpausing", async function () {
            await token.unpause();
            const wallet1Address = await wallet1.getAddress();
            const wallet2Address = await wallet2.getAddress();
            const initialBalance1 = await token.balanceOf(wallet1Address, 1);
            const initialBalance2 = await token.balanceOf(wallet2Address, 1);

            await token.connect(wallet1).safeTransferFrom(
                wallet1Address,
                wallet2Address,
                1,
                100,
                "0x"
            );

            expect(await token.balanceOf(wallet1Address, 1)).to.equal(initialBalance1 - 100n);
            expect(await token.balanceOf(wallet2Address, 1)).to.equal(initialBalance2 + 100n);
        });
    });

    describe("View Functions When Paused", function () {
        beforeEach(async function () {
            await token.pause();
        });

        it("Should allow view functions when paused", async function () {
            const wallet1Address = await wallet1.getAddress();

            expect(await token.balanceOf(wallet1Address, 1)).to.equal(1000);
            expect(await token.totalSupply(1)).to.equal(1000);
            expect(await token.exists(1)).to.be.true;
            expect(await token.uri(1)).to.equal(uri);
        });

        it("Should allow approval functions when paused", async function () {
            const wallet1Address = await wallet1.getAddress();
            const wallet2Address = await wallet2.getAddress();

            await token.connect(wallet1).setApprovalForAll(wallet2Address, true);
            expect(await token.isApprovedForAll(wallet1Address, wallet2Address)).to.be.true;
        });
    });

    describe("Owner Functions When Paused", function () {
        beforeEach(async function () {
            await token.pause();
        });

        it("Should allow owner to change ownership when paused", async function () {
            const wallet1Address = await wallet1.getAddress();
            await token.transferOwnership(wallet1Address);

            expect(await token.owner()).to.equal(wallet1Address);
        });

        it("Should allow new owner to unpause", async function () {
            const wallet1Address = await wallet1.getAddress();
            await token.transferOwnership(wallet1Address);

            await token.connect(wallet1).unpause();
            expect(await token.paused()).to.be.false;
        });
    });

    describe("Supply Tracking When Paused", function () {
        it("Should maintain supply tracking across pause states", async function () {
            const wallet1Address = await wallet1.getAddress();
            const initialSupply = await token.totalSupply(1);

            // Pause, unpause, then mint
            await token.pause();
            await token.unpause();
            await token.mint(wallet1Address, 1, 100, "0x");

            expect(await token.totalSupply(1)).to.equal(initialSupply + 100n);
        });
    });
}); 