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
            await token.connect(wallet1).mint(wallet1Address, 1, 100, "0x");

            expect(await token.balanceOf(wallet1Address, 1)).to.equal(100);
            expect(await token.totalSupply(1)).to.equal(100);
            expect(await token.exists(1)).to.be.true;
        });

        it("Should allow anyone to mint tokens for others", async function () {
            const wallet1Address = await wallet1.getAddress();
            const wallet2Address = await wallet2.getAddress();

            // wallet1 mints tokens for wallet2
            await token.connect(wallet1).mint(wallet2Address, 1, 150, "0x");

            expect(await token.balanceOf(wallet2Address, 1)).to.equal(150);
            expect(await token.balanceOf(wallet1Address, 1)).to.equal(0);
            expect(await token.totalSupply(1)).to.equal(150);
        });

        it("Should allow owner to mint tokens", async function () {
            const ownerAddress = await owner.getAddress();

            await token.connect(owner).mint(ownerAddress, 1, 200, "0x");

            expect(await token.balanceOf(ownerAddress, 1)).to.equal(200);
            expect(await token.totalSupply(1)).to.equal(200);
        });

        it("Should track supply correctly when multiple users mint", async function () {
            const wallet1Address = await wallet1.getAddress();
            const wallet2Address = await wallet2.getAddress();

            await token.connect(wallet1).mint(wallet1Address, 1, 100, "0x");
            await token.connect(wallet2).mint(wallet2Address, 1, 50, "0x");

            expect(await token.totalSupply(1)).to.equal(150);
            expect(await token.balanceOf(wallet1Address, 1)).to.equal(100);
            expect(await token.balanceOf(wallet2Address, 1)).to.equal(50);
        });

        it("Should fail when minting to zero address", async function () {
            await expect(
                token.connect(wallet1).mint(ethers.ZeroAddress, 1, 100, "0x"),
            ).to.be.reverted;
        });
    });

    describe("Public Batch Minting", function () {
        it("Should allow anyone to batch mint tokens", async function () {
            const wallet1Address = await wallet1.getAddress();

            await token.connect(wallet1).mintBatch(wallet1Address, [1, 2, 3], [100, 200, 50], "0x");

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
            const wallet2Address = await wallet2.getAddress();

            // Mint tokens for testing
            await token.connect(wallet1).mint(wallet1Address, 1, 1000, "0x");
            await token.connect(wallet2).mint(wallet2Address, 2, 500, "0x");
            await token.connect(wallet1).mintBatch(wallet1Address, [3, 4], [300, 200], "0x");
        });

        it("Should allow token holders to burn their own tokens", async function () {
            const wallet1Address = await wallet1.getAddress();
            const initialBalance = await token.balanceOf(wallet1Address, 1);
            const initialSupply = await token.totalSupply(1);

            await token.connect(wallet1).burn(wallet1Address, 1, 200);

            expect(await token.balanceOf(wallet1Address, 1)).to.equal(initialBalance - 200n);
            expect(await token.totalSupply(1)).to.equal(initialSupply - 200n);
        });

        it("Should allow approved operators to burn tokens", async function () {
            const wallet1Address = await wallet1.getAddress();
            const wallet2Address = await wallet2.getAddress();
            const initialBalance = await token.balanceOf(wallet1Address, 1);
            const initialSupply = await token.totalSupply(1);

            // wallet1 approves wallet2 to operate on their tokens
            await token.connect(wallet1).setApprovalForAll(wallet2Address, true);

            // wallet2 burns tokens from wallet1's account
            await token.connect(wallet2).burn(wallet1Address, 1, 150);

            expect(await token.balanceOf(wallet1Address, 1)).to.equal(initialBalance - 150n);
            expect(await token.totalSupply(1)).to.equal(initialSupply - 150n);
        });

        it("Should prevent unauthorized users from burning tokens", async function () {
            const wallet1Address = await wallet1.getAddress();

            await expect(
                token.connect(wallet2).burn(wallet1Address, 1, 100),
            ).to.be.reverted;
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
            await token.connect(wallet1).mintBatch(wallet1Address, [5, 6], [500, 300], "0x");
        });

        it("Should allow token holders to batch burn their own tokens", async function () {
            const wallet1Address = await wallet1.getAddress();
            const initialBalance5 = await token.balanceOf(wallet1Address, 5);
            const initialBalance6 = await token.balanceOf(wallet1Address, 6);

            await token.connect(wallet1).burnBatch(wallet1Address, [5, 6], [100, 50]);

            expect(await token.balanceOf(wallet1Address, 5)).to.equal(initialBalance5 - 100n);
            expect(await token.balanceOf(wallet1Address, 6)).to.equal(initialBalance6 - 50n);
        });

        it("Should allow approved operators to batch burn", async function () {
            const wallet1Address = await wallet1.getAddress();
            const wallet2Address = await wallet2.getAddress();

            await token.connect(wallet1).setApprovalForAll(wallet2Address, true);
            await token.connect(wallet2).burnBatch(wallet1Address, [5, 6], [50, 25]);

            expect(await token.balanceOf(wallet1Address, 5)).to.equal(450);
            expect(await token.balanceOf(wallet1Address, 6)).to.equal(275);
        });

        it("Should prevent unauthorized batch burning", async function () {
            const wallet1Address = await wallet1.getAddress();

            await expect(
                token.connect(wallet2).burnBatch(wallet1Address, [5, 6], [50, 25]),
            ).to.be.reverted;
        });
    });

    describe("Supply Tracking", function () {
        it("Should update exists status correctly", async function () {
            const wallet1Address = await wallet1.getAddress();

            expect(await token.exists(10)).to.be.false;

            await token.connect(wallet1).mint(wallet1Address, 10, 100, "0x");
            expect(await token.exists(10)).to.be.true;

            await token.connect(wallet1).burn(wallet1Address, 10, 100);
            expect(await token.exists(10)).to.be.false;
        });

        it("Should track total supply across multiple mints and burns", async function () {
            const wallet1Address = await wallet1.getAddress();
            const wallet2Address = await wallet2.getAddress();

            await token.connect(wallet1).mint(wallet1Address, 7, 100, "0x");
            await token.connect(wallet2).mint(wallet2Address, 7, 50, "0x");
            expect(await token.totalSupply(7)).to.equal(150);

            await token.connect(wallet1).burn(wallet1Address, 7, 30);
            expect(await token.totalSupply(7)).to.equal(120);
        });
    });

    describe("Standard ERC1155 Functions", function () {
        beforeEach(async function () {
            const wallet1Address = await wallet1.getAddress();
            await token.connect(wallet1).mint(wallet1Address, 8, 1000, "0x");
        });

        it("Should transfer tokens between accounts", async function () {
            const wallet1Address = await wallet1.getAddress();
            const wallet2Address = await wallet2.getAddress();

            await token.connect(wallet1).safeTransferFrom(
                wallet1Address,
                wallet2Address,
                8,
                200,
                "0x"
            );

            expect(await token.balanceOf(wallet1Address, 8)).to.equal(800);
            expect(await token.balanceOf(wallet2Address, 8)).to.equal(200);
            expect(await token.totalSupply(8)).to.equal(1000); // Total supply unchanged
        });

        it("Should handle approvals correctly", async function () {
            const wallet1Address = await wallet1.getAddress();
            const wallet2Address = await wallet2.getAddress();

            await token.connect(wallet1).setApprovalForAll(wallet2Address, true);
            expect(await token.isApprovedForAll(wallet1Address, wallet2Address)).to.be.true;

            await token.connect(wallet2).safeTransferFrom(
                wallet1Address,
                wallet2Address,
                8,
                100,
                "0x"
            );

            expect(await token.balanceOf(wallet1Address, 8)).to.equal(900);
            expect(await token.balanceOf(wallet2Address, 8)).to.equal(100);
        });

        it("Should prevent unauthorized transfers", async function () {
            const wallet1Address = await wallet1.getAddress();
            const wallet2Address = await wallet2.getAddress();

            await expect(
                token.connect(wallet2).safeTransferFrom(
                    wallet1Address,
                    wallet2Address,
                    8,
                    100,
                    "0x"
                ),
            ).to.be.reverted;
        });
    });

    describe("Multiple Users Interaction", function () {
        it("Should handle complex multi-user scenarios", async function () {
            const wallet1Address = await wallet1.getAddress();
            const wallet2Address = await wallet2.getAddress();
            const ownerAddress = await owner.getAddress();

            // Everyone mints different tokens
            await token.connect(wallet1).mint(wallet1Address, 9, 100, "0x");
            await token.connect(wallet2).mint(wallet2Address, 9, 200, "0x");
            await token.connect(owner).mint(ownerAddress, 9, 50, "0x");

            expect(await token.totalSupply(9)).to.equal(350);

            // Cross-minting (minting for others)
            await token.connect(wallet1).mint(wallet2Address, 10, 75, "0x");
            await token.connect(wallet2).mint(wallet1Address, 11, 125, "0x");

            expect(await token.balanceOf(wallet2Address, 10)).to.equal(75);
            expect(await token.balanceOf(wallet1Address, 11)).to.equal(125);

            // Approvals and burning
            await token.connect(wallet1).setApprovalForAll(wallet2Address, true);
            await token.connect(wallet2).burn(wallet1Address, 9, 50);

            expect(await token.balanceOf(wallet1Address, 9)).to.equal(50);
            expect(await token.totalSupply(9)).to.equal(300);
        });
    });
}); 