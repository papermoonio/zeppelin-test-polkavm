import { expect } from "chai";
import { ethers } from "hardhat";
import { PVMERC1155Pausable } from "../typechain-types/contracts/PVMERC1155Pausable";
import { Signer } from "ethers";
import { getWallets } from "./test_util";
describe("PVMERC1155Pausable", function () {
    let token: PVMERC1155Pausable;
    let owner: Signer;
    let wallet1: Signer;
    let wallet2: Signer;

    const uri = "https://api.example.com/metadata/{id}.json";

    beforeEach(async function () {
        [owner, wallet1] = getWallets(2);
        wallet2 = ethers.Wallet.createRandom(ethers.getDefaultProvider());

        const ERC1155PausableFactory = await ethers.getContractFactory("PVMERC1155Pausable", owner);
        token = await ERC1155PausableFactory.deploy(uri);
        await token.waitForDeployment();

        // Mint some tokens for testing
        const wallet1Address = await wallet1.getAddress();
        const wallet2Address = await wallet2.getAddress();
        const txMint = await token.mint(wallet1Address, 1, 1000, "0x");
        await txMint.wait();
        const txMint2 = await token.mint(wallet2Address, 2, 500, "0x");
        await txMint2.wait();
        const txMintBatch = await token.mintBatch(wallet1Address, [3, 4], [300, 200], "0x");
        await txMintBatch.wait();
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
            const txPause = await token.pause();
            await txPause.wait();
            expect(await token.paused()).to.be.true;
        });

        it("Should allow owner to unpause the contract", async function () {
            const txPause = await token.pause();
            await txPause.wait();
            const txUnpause = await token.unpause();
            await txUnpause.wait();
            expect(await token.paused()).to.be.false;
        });

        it("Should prevent non-owner from pausing", async function () {
            await expect(
                token.connect(wallet1).pause(),
            ).to.be.reverted;
        });

        it("Should prevent non-owner from unpausing", async function () {
            const txPause = await token.pause();
            await txPause.wait();
            await expect(
                token.connect(wallet1).unpause(),
            ).to.be.reverted;
        });
    });

    describe("Minting When Paused", function () {
        beforeEach(async function () {
            const txPause = await token.pause();
            await txPause.wait();
        });

        it("Should prevent batch minting when paused", async function () {
            const wallet1Address = await wallet1.getAddress();
            await expect(
                token.mintBatch(wallet1Address, [5, 6], [100, 200], "0x"),
            ).to.be.reverted;
        });

        it("Should allow minting after unpausing", async function () {
            const txUnpause = await token.unpause();
            await txUnpause.wait();
            const wallet1Address = await wallet1.getAddress();

            const txMint = await token.mint(wallet1Address, 5, 100, "0x");
            await txMint.wait();
            expect(await token.balanceOf(wallet1Address, 5)).to.equal(100);
        });
    });

    describe("Burning When Paused", function () {
        beforeEach(async function () {
            const txPause = await token.pause();
            await txPause.wait();
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
            const txUnpause = await token.unpause();
            await txUnpause.wait();
            const wallet1Address = await wallet1.getAddress();
            const initialBalance = await token.balanceOf(wallet1Address, 1);

            const txBurn = await token.burn(wallet1Address, 1, 100);
            await txBurn.wait();
            expect(await token.balanceOf(wallet1Address, 1)).to.equal(initialBalance - 100n);
        });
    });

    describe("Transfers When Paused", function () {
        beforeEach(async function () {
            const txPause = await token.pause();
            await txPause.wait();
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
            const txUnpause = await token.unpause();
            await txUnpause.wait();
            const wallet1Address = await wallet1.getAddress();
            const wallet2Address = await wallet2.getAddress();
            const initialBalance1 = await token.balanceOf(wallet1Address, 1);
            const initialBalance2 = await token.balanceOf(wallet2Address, 1);

            const txTransfer = await token.connect(wallet1).safeTransferFrom(
                wallet1Address,
                wallet2Address,
                1,
                100,
                "0x"
            );
            await txTransfer.wait();
            expect(await token.balanceOf(wallet1Address, 1)).to.equal(initialBalance1 - 100n);
            expect(await token.balanceOf(wallet2Address, 1)).to.equal(initialBalance2 + 100n);
        });
    });

    describe("View Functions When Paused", function () {
        beforeEach(async function () {
            const txPause = await token.pause();
            await txPause.wait();
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

            const txApprove = await token.connect(wallet1).setApprovalForAll(wallet2Address, true);
            await txApprove.wait();
            expect(await token.isApprovedForAll(wallet1Address, wallet2Address)).to.be.true;
        });
    });

    describe("Owner Functions When Paused", function () {
        beforeEach(async function () {
            const txPause = await token.pause();
            await txPause.wait();
        });

        it("Should allow owner to change ownership when paused", async function () {
            const wallet1Address = await wallet1.getAddress();
            const txTransfer = await token.transferOwnership(wallet1Address);
            await txTransfer.wait();

            expect(await token.owner()).to.equal(wallet1Address);
        });

        it("Should allow new owner to unpause", async function () {
            const wallet1Address = await wallet1.getAddress();
            const txTransfer = await token.transferOwnership(wallet1Address);
            await txTransfer.wait();

            const txUnpause = await token.connect(wallet1).unpause();
            await txUnpause.wait();
            expect(await token.paused()).to.be.false;
        });
    });

    describe("Supply Tracking When Paused", function () {
        it("Should maintain supply tracking across pause states", async function () {
            const wallet1Address = await wallet1.getAddress();
            const initialSupply = await token.totalSupply(1);

            // Pause, unpause, then mint
            const txPause = await token.pause();
            await txPause.wait();
            const txUnpause = await token.unpause();
            await txUnpause.wait();
            const txMint = await token.mint(wallet1Address, 1, 100, "0x");
            await txMint.wait();

            expect(await token.totalSupply(1)).to.equal(initialSupply + 100n);
        });
    });
}); 