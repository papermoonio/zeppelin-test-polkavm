import { expect } from "chai";
import { ethers } from "hardhat";
import { Signer } from "ethers";

import { PVMERC1155 } from "../typechain-types/contracts/PVMERC1155";
import { getWallets } from "./test_util";

describe("ERC1155", function () {
    let token: PVMERC1155;
    let owner: Signer;
    let wallet1: Signer;
    let wallet2: Signer;

    const uri = "https://api.example.com/metadata/{id}.json";

    before(async function () {
        [owner, wallet1] = getWallets(2);
        wallet2 = ethers.Wallet.createRandom(ethers.getDefaultProvider());

        const ERC1155Factory = await ethers.getContractFactory("PVMERC1155", owner);
        token = await ERC1155Factory.deploy(uri);
        await token.waitForDeployment();
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
        it("Should allow owner to mint tokens", async function () {
            const wallet1Address = await wallet1.getAddress();
            const txMint = await token.mint(wallet1Address, 1, 100, "0x");
            await txMint.wait();

            expect(await token.balanceOf(wallet1Address, 1)).to.equal(100);
            expect(await token.totalSupply(1)).to.equal(100);
            expect(await token.exists(1)).to.be.true;
        });

        it("Should prevent non-owners from minting", async function () {
            const wallet1Address = await wallet1.getAddress();
            await expect(
                token.connect(wallet1).mint(wallet1Address, 1, 100, "0x")
            ).to.be.reverted;
        });

        it("Should allow batch minting", async function () {
            const wallet1Address = await wallet1.getAddress();
            const txMintBatch = await token.mintBatch(wallet1Address, [2, 3], [200, 300], "0x");
            await txMintBatch.wait();

            expect(await token.balanceOf(wallet1Address, 2)).to.equal(200);
            expect(await token.balanceOf(wallet1Address, 3)).to.equal(300);
        });
    });

    describe("Burning", function () {
        beforeEach(async function () {
            const wallet1Address = await wallet1.getAddress();
            const txMint = await token.mint(wallet1Address, 4, 500, "0x");
            await txMint.wait();
        });

        it("Should allow burning of owned tokens", async function () {
            const wallet1Address = await wallet1.getAddress();
            const txBurn = await token.connect(owner).burn(wallet1Address, 4, 100);
            await txBurn.wait();

            expect(await token.balanceOf(wallet1Address, 4)).to.equal(400);
            expect(await token.totalSupply(4)).to.equal(400);
        });

        it("Should prevent burning more than balance", async function () {
            const wallet1Address = await wallet1.getAddress();
            await expect(
                token.connect(wallet1).burn(wallet1Address, 4, 600)
            ).to.be.reverted;
        });
    });

    describe("Transfers", function () {
        beforeEach(async function () {
            const wallet1Address = await wallet1.getAddress();
            const txMint = await token.mint(wallet1Address, 5, 1000, "0x");
            await txMint.wait();
        });

        it("Should allow transfer between accounts", async function () {
            const wallet1Address = await wallet1.getAddress();
            const wallet2Address = await wallet2.getAddress();

            const txTransfer = await token.connect(wallet1).safeTransferFrom(
                wallet1Address,
                wallet2Address,
                5,
                200,
                "0x"
            );
            await txTransfer.wait();
            expect(await token.balanceOf(wallet1Address, 5)).to.equal(800);
            expect(await token.balanceOf(wallet2Address, 5)).to.equal(200);
        });
    });

    describe("Approvals", function () {
        it("Should allow setting approval for all", async function () {
            const wallet1Address = await wallet1.getAddress();
            const wallet2Address = await wallet2.getAddress();

            const txApprove = await token.connect(wallet1).setApprovalForAll(wallet2Address, true);
            await txApprove.wait();
            expect(await token.isApprovedForAll(wallet1Address, wallet2Address)).to.be.true;
        });
    });
}); 