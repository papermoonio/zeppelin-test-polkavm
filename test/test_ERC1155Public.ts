import { expect } from "chai";
import { ethers } from "hardhat";
import { PVMERC1155Public } from "../typechain-types/contracts/PVMERC1155Public";
import { Signer } from "ethers";
import { getWallets } from "./test_util";

describe("PVMERC1155Public", function () {
    let token: PVMERC1155Public;
    let owner: Signer;
    let wallet1: Signer;
    let wallet2: Signer;

    const uri = "https://api.example.com/metadata/{id}.json";

    beforeEach(async function () {
        [owner, wallet1] = await getWallets(2);
        wallet2 = ethers.Wallet.createRandom(ethers.getDefaultProvider());

        const ERC1155PublicFactory = await ethers.getContractFactory("PVMERC1155Public", owner);
        token = await ERC1155PublicFactory.deploy(uri);
        await token.waitForDeployment();
    });

    describe("Deployment", function () {
        it("Should set the correct URI", async function () {
            expect(await token.uri(1)).to.equal(uri);
        });

        it("Should start with zero total supply for all token IDs", async function () {
            expect(await token.totalSupply(1)).to.equal(0);
            expect(await token.totalSupply(2)).to.equal(0);
        });

        it("Should return false for exists on unminted tokens", async function () {
            expect(await token.exists(1)).to.be.false;
            expect(await token.exists(2)).to.be.false;
        });
    });

    describe("Public Minting", function () {
        it("Should allow anyone to mint tokens", async function () {
            const wallet1Address = await wallet1.getAddress();

            // wallet1 mints tokens for themselves
            const mintTx = await token.connect(wallet1).mint(wallet1Address, 1, 100, "0x");
            await mintTx.wait();
            expect(await token.balanceOf(wallet1Address, 1)).to.equal(100);
            expect(await token.totalSupply(1)).to.equal(100);
            expect(await token.exists(1)).to.be.true;
        });

        it("Should allow anyone to mint tokens for others", async function () {
            const wallet1Address = await wallet1.getAddress();
            const wallet2Address = await wallet2.getAddress();

            // wallet1 mints tokens for wallet2
            const mintTx = await token.connect(wallet1).mint(wallet2Address, 1, 150, "0x");
            await mintTx.wait();

            expect(await token.balanceOf(wallet2Address, 1)).to.equal(150);
            expect(await token.balanceOf(wallet1Address, 1)).to.equal(0);
            expect(await token.totalSupply(1)).to.equal(150);
        });

        it("Should allow owner to mint tokens", async function () {
            const ownerAddress = await owner.getAddress();

            const mintTx = await token.connect(owner).mint(ownerAddress, 1, 200, "0x");
            await mintTx.wait();

            expect(await token.balanceOf(ownerAddress, 1)).to.equal(200);
            expect(await token.totalSupply(1)).to.equal(200);
        });
    });

    describe("Public Batch Minting", function () {
        it("Should allow anyone to batch mint tokens", async function () {
            const wallet1Address = await wallet1.getAddress();

            const mintTx = await token.connect(wallet1).mintBatch(wallet1Address, [1, 2, 3], [100, 200, 50], "0x");
            await mintTx.wait();

            expect(await token.balanceOf(wallet1Address, 1)).to.equal(100);
            expect(await token.balanceOf(wallet1Address, 2)).to.equal(200);
            expect(await token.balanceOf(wallet1Address, 3)).to.equal(50);
            expect(await token.totalSupply(1)).to.equal(100);
            expect(await token.totalSupply(2)).to.equal(200);
            expect(await token.totalSupply(3)).to.equal(50);
        });

        it("Should fail when batch minting to zero address", async function () {
            await expect(
                token.connect(wallet1).mintBatch(ethers.ZeroAddress, [1, 2], [100, 200], "0x"),
            ).to.be.reverted;
        });

        it("Should fail when ids and values arrays have different lengths", async function () {
            const wallet1Address = await wallet1.getAddress();
            await expect(
                token.connect(wallet1).mintBatch(wallet1Address, [1, 2], [100], "0x"),
            ).to.be.reverted;
        });
    });

    describe("Permission-Based Burning", function () {
        beforeEach(async function () {
            const wallet1Address = await wallet1.getAddress();

            // Mint tokens for testing
            const mintTx1 = await token.connect(wallet1).mint(wallet1Address, 1, 1000, "0x");
            await mintTx1.wait();
            const mintTx3 = await token.connect(wallet1).mintBatch(wallet1Address, [3, 4], [300, 200], "0x");
            await mintTx3.wait();
        });

        it("Should allow token holders to burn their own tokens", async function () {
            const wallet1Address = await wallet1.getAddress();
            const initialBalance = await token.balanceOf(wallet1Address, 1);
            const initialSupply = await token.totalSupply(1);

            const burnTx = await token.connect(wallet1).burn(wallet1Address, 1, 200);
            await burnTx.wait();

            expect(await token.balanceOf(wallet1Address, 1)).to.equal(initialBalance - 200n);
            expect(await token.totalSupply(1)).to.equal(initialSupply - 200n);
        });

        it("Should prevent burning from zero address", async function () {
            await expect(
                token.connect(wallet1).burn(ethers.ZeroAddress, 1, 100),
            ).to.be.reverted;
        });

        it("Should prevent burning more than balance", async function () {
            const wallet1Address = await wallet1.getAddress();

            await expect(
                token.connect(wallet1).burn(wallet1Address, 1, 2000),
            ).to.be.reverted;
        });
    });

    describe("Permission-Based Batch Burning", function () {
        beforeEach(async function () {
            const wallet1Address = await wallet1.getAddress();
            const mintTx = await token.connect(wallet1).mintBatch(wallet1Address, [5, 6], [500, 300], "0x");
            await mintTx.wait();
        });

        it("Should allow token holders to batch burn their own tokens", async function () {
            const wallet1Address = await wallet1.getAddress();
            const initialBalance5 = await token.balanceOf(wallet1Address, 5);
            const initialBalance6 = await token.balanceOf(wallet1Address, 6);

            const burnTx = await token.connect(wallet1).burnBatch(wallet1Address, [5, 6], [100, 50]);
            await burnTx.wait();

            expect(await token.balanceOf(wallet1Address, 5)).to.equal(initialBalance5 - 100n);
            expect(await token.balanceOf(wallet1Address, 6)).to.equal(initialBalance6 - 50n);
        });

    });

    describe("Supply Tracking", function () {
        it("Should update exists status correctly", async function () {
            const wallet1Address = await wallet1.getAddress();

            expect(await token.exists(10)).to.be.false;

            const mintTx = await token.connect(wallet1).mint(wallet1Address, 10, 100, "0x");
            await mintTx.wait();
            expect(await token.exists(10)).to.be.true;

            const burnTx = await token.connect(wallet1).burn(wallet1Address, 10, 100);
            await burnTx.wait();
            expect(await token.exists(10)).to.be.false;
        });

        it("Should track total supply across multiple mints and burns", async function () {
            const wallet1Address = await wallet1.getAddress();

            const mintTx1 = await token.connect(wallet1).mint(wallet1Address, 7, 100, "0x");
            await mintTx1.wait();
            expect(await token.totalSupply(7)).to.equal(100);

            const burnTx = await token.connect(wallet1).burn(wallet1Address, 7, 30);
            await burnTx.wait();
            expect(await token.totalSupply(7)).to.equal(70);
        });
    });

    describe("Standard ERC1155 Functions", function () {
        beforeEach(async function () {
            const wallet1Address = await wallet1.getAddress();
            const mintTx = await token.connect(wallet1).mint(wallet1Address, 8, 1000, "0x");
            await mintTx.wait();
        });

        it("Should transfer tokens between accounts", async function () {
            const wallet1Address = await wallet1.getAddress();
            const wallet2Address = await wallet2.getAddress();

            const transferTx = await token.connect(wallet1).safeTransferFrom(
                wallet1Address,
                wallet2Address,
                8,
                200,
                "0x"
            );
            await transferTx.wait();
            expect(await token.balanceOf(wallet1Address, 8)).to.equal(800);
            expect(await token.balanceOf(wallet2Address, 8)).to.equal(200);
            expect(await token.totalSupply(8)).to.equal(1000); // Total supply unchanged
        });

    });
}); 