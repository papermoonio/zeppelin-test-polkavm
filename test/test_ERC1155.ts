import { expect } from "chai";
import { ethers } from "hardhat";
import { Signer } from "ethers";

import { PVMERC1155 } from "../typechain-types/contracts/PVMERC1155";

describe("ERC1155", function () {
    let token: PVMERC1155;
    let owner: Signer;
    let wallet1: Signer;
    let wallet2: Signer;

    const uri = "https://api.example.com/metadata/{id}.json";

    before(async function () {
        [owner, wallet1] = getWallets(2);
        wallet2 = ethers.Wallet.createRandom(ethers.getDefaultProvider());

        try {
            const ERC1155Factory = await ethers.getContractFactory("PVMERC1155");
            token = await ERC1155Factory.deploy(uri);
            await token.waitForDeployment();
        } catch (error) {
            console.error(error);
        }
    });

    describe("Deployment", function () {
        it("Should set the correct URI", async function () {
            expect(await token.uri(1)).to.equal(uri);
        });

        it("Should set the deployer as owner", async function () {
            expect(await token.owner()).to.equal(await owner.getAddress());
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

    describe("Minting", function () {
        it("Should mint a single token", async function () {
            const ownerAddress = await owner.getAddress();
            await token.mint(ownerAddress, 1, 100, "0x");

            expect(await token.balanceOf(ownerAddress, 1)).to.equal(100);
            expect(await token.totalSupply(1)).to.equal(100);
            expect(await token.exists(1)).to.be.true;
        });

        it("Should mint batch tokens", async function () {
            const ownerAddress = await owner.getAddress();
            await token.mintBatch(ownerAddress, [2, 3], [50, 25], "0x");

            expect(await token.balanceOf(ownerAddress, 2)).to.equal(50);
            expect(await token.balanceOf(ownerAddress, 3)).to.equal(25);
            expect(await token.totalSupply(2)).to.equal(50);
            expect(await token.totalSupply(3)).to.equal(25);
            expect(await token.exists(2)).to.be.true;
            expect(await token.exists(3)).to.be.true;
        });

        it("Should fail when minting to zero address", async function () {
            await expect(
                token.mint(ethers.ZeroAddress, 4, 100, "0x"),
            ).to.be.reverted;
        });

        it("Should fail when minting batch to zero address", async function () {
            await expect(
                token.mintBatch(ethers.ZeroAddress, [4, 5], [100, 200], "0x"),
            ).to.be.reverted;
        });

        it("Should fail when minting batch with mismatched arrays", async function () {
            const ownerAddress = await owner.getAddress();
            await expect(
                token.mintBatch(ownerAddress, [4, 5], [100], "0x"),
            ).to.be.reverted;
        });

        it("Should prevent non-owner from minting", async function () {
            const wallet1Address = await wallet1.getAddress();
            await expect(
                token.connect(wallet1).mint(wallet1Address, 6, 100, "0x"),
            ).to.be.reverted;
        });
    });

    describe("Burning", function () {
        beforeEach(async function () {
            const ownerAddress = await owner.getAddress();
            // Mint some tokens for burning tests
            await token.mint(ownerAddress, 10, 1000, "0x");
            await token.mintBatch(ownerAddress, [11, 12], [500, 300], "0x");
        });

        it("Should burn single tokens", async function () {
            const ownerAddress = await owner.getAddress();
            await token.burn(ownerAddress, 10, 200);

            expect(await token.balanceOf(ownerAddress, 10)).to.equal(800);
            expect(await token.totalSupply(10)).to.equal(800);
        });

        it("Should burn batch tokens", async function () {
            const ownerAddress = await owner.getAddress();
            await token.burnBatch(ownerAddress, [11, 12], [100, 50]);

            expect(await token.balanceOf(ownerAddress, 11)).to.equal(400);
            expect(await token.balanceOf(ownerAddress, 12)).to.equal(250);
            expect(await token.totalSupply(11)).to.equal(400);
            expect(await token.totalSupply(12)).to.equal(250);
        });

        it("Should fail when burning from zero address", async function () {
            await expect(
                token.burn(ethers.ZeroAddress, 10, 100),
            ).to.be.reverted;
        });

        it("Should fail when burning more than balance", async function () {
            const ownerAddress = await owner.getAddress();
            await expect(
                token.burn(ownerAddress, 10, 2000),
            ).to.be.reverted;
        });

        it("Should prevent non-owner from burning", async function () {
            const ownerAddress = await owner.getAddress();
            await expect(
                token.connect(wallet1).burn(ownerAddress, 10, 100),
            ).to.be.reverted;
        });
    });

    describe("Transfers", function () {
        beforeEach(async function () {
            const ownerAddress = await owner.getAddress();
            // Mint tokens for transfer tests
            await token.mint(ownerAddress, 20, 1000, "0x");
        });

        it("Should transfer tokens between accounts", async function () {
            const ownerAddress = await owner.getAddress();
            const wallet1Address = await wallet1.getAddress();

            await token.connect(owner).safeTransferFrom(
                ownerAddress,
                wallet1Address,
                20,
                200,
                "0x"
            );

            expect(await token.balanceOf(ownerAddress, 20)).to.equal(800);
            expect(await token.balanceOf(wallet1Address, 20)).to.equal(200);
        });

        it("Should transfer tokens with approval", async function () {
            const ownerAddress = await owner.getAddress();
            const wallet1Address = await wallet1.getAddress();

            await token.connect(owner).setApprovalForAll(wallet1Address, true);
            await token.connect(wallet1).safeTransferFrom(
                ownerAddress,
                wallet1Address,
                20,
                100,
                "0x"
            );

            expect(await token.balanceOf(ownerAddress, 20)).to.equal(700);
            expect(await token.balanceOf(wallet1Address, 20)).to.equal(300);
        });

        it("Should fail transfer without approval", async function () {
            const ownerAddress = await owner.getAddress();
            const wallet1Address = await wallet1.getAddress();
            const wallet2Address = await wallet2.getAddress();

            await expect(
                token.connect(wallet1).safeTransferFrom(
                    ownerAddress,
                    wallet2Address,
                    20,
                    100,
                    "0x"
                ),
            ).to.be.reverted;
        });
    });
}); 