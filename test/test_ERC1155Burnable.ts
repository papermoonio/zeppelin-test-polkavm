import { expect } from "chai";
import { ethers } from "hardhat";
import { PVMERC1155Burnable } from "../typechain-types/contracts/PVMERC1155Burnable";
import { Signer } from "ethers";

describe("PVMERC1155Burnable", function () {
    let token: PVMERC1155Burnable;
    let owner: Signer;
    let wallet1: Signer;
    let wallet2: Signer;

    const uri = "https://api.example.com/metadata/{id}.json";

    beforeEach(async function () {
        [owner, wallet1] = await ethers.getSigners();
        wallet2 = ethers.Wallet.createRandom(ethers.getDefaultProvider());

        try {
            const ERC1155BurnableFactory = await ethers.getContractFactory("PVMERC1155Burnable");
            token = await ERC1155BurnableFactory.deploy(uri);
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
    });

    describe("Owner Minting", function () {
        it("Should allow owner to mint tokens", async function () {
            const wallet1Address = await wallet1.getAddress();
            await token.mint(wallet1Address, 5, 100, "0x");

            expect(await token.balanceOf(wallet1Address, 5)).to.equal(100);
            expect(await token.totalSupply(5)).to.equal(100);
            expect(await token.exists(5)).to.be.true;
        });

        it("Should prevent non-owner from minting", async function () {
            const wallet1Address = await wallet1.getAddress();
            await expect(
                token.connect(wallet1).mint(wallet1Address, 6, 100, "0x"),
            ).to.be.reverted;
        });
    });

    describe("Token Holder Burning", function () {
        it("Should allow token holders to burn their own tokens", async function () {
            const wallet1Address = await wallet1.getAddress();
            const initialBalance = await token.balanceOf(wallet1Address, 1);
            const initialSupply = await token.totalSupply(1);

            await token.connect(wallet1).burn(wallet1Address, 1, 200);

            expect(await token.balanceOf(wallet1Address, 1)).to.equal(initialBalance - 200n);
            expect(await token.totalSupply(1)).to.equal(initialSupply - 200n);
        });

        it("Should allow token holders to burn batch tokens", async function () {
            const wallet1Address = await wallet1.getAddress();
            const initialBalance3 = await token.balanceOf(wallet1Address, 3);
            const initialBalance4 = await token.balanceOf(wallet1Address, 4);
            const initialSupply3 = await token.totalSupply(3);
            const initialSupply4 = await token.totalSupply(4);

            await token.connect(wallet1).burnBatch(wallet1Address, [3, 4], [50, 25]);

            expect(await token.balanceOf(wallet1Address, 3)).to.equal(initialBalance3 - 50n);
            expect(await token.balanceOf(wallet1Address, 4)).to.equal(initialBalance4 - 25n);
            expect(await token.totalSupply(3)).to.equal(initialSupply3 - 50n);
            expect(await token.totalSupply(4)).to.equal(initialSupply4 - 25n);
        });

        it("Should prevent burning more tokens than balance", async function () {
            const wallet1Address = await wallet1.getAddress();
            await expect(
                token.connect(wallet1).burn(wallet1Address, 1, 2000),
            ).to.be.reverted;
        });

        it("Should prevent unauthorized users from burning tokens", async function () {
            const wallet1Address = await wallet1.getAddress();
            await expect(
                token.connect(wallet2).burn(wallet1Address, 1, 100),
            ).to.be.reverted;
        });
    });

    describe("Approved Burning", function () {
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

        it("Should allow approved operators to burn batch tokens", async function () {
            const wallet1Address = await wallet1.getAddress();
            const wallet2Address = await wallet2.getAddress();
            const initialBalance3 = await token.balanceOf(wallet1Address, 3);
            const initialBalance4 = await token.balanceOf(wallet1Address, 4);
            const initialSupply3 = await token.totalSupply(3);
            const initialSupply4 = await token.totalSupply(4);

            // wallet1 approves wallet2 to operate on their tokens
            await token.connect(wallet1).setApprovalForAll(wallet2Address, true);

            // wallet2 burns batch tokens from wallet1's account
            await token.connect(wallet2).burnBatch(wallet1Address, [3, 4], [30, 20]);

            expect(await token.balanceOf(wallet1Address, 3)).to.equal(initialBalance3 - 30n);
            expect(await token.balanceOf(wallet1Address, 4)).to.equal(initialBalance4 - 20n);
            expect(await token.totalSupply(3)).to.equal(initialSupply3 - 30n);
            expect(await token.totalSupply(4)).to.equal(initialSupply4 - 20n);
        });

        it("Should prevent burning after approval is revoked", async function () {
            const wallet1Address = await wallet1.getAddress();
            const wallet2Address = await wallet2.getAddress();

            // wallet1 approves wallet2
            await token.connect(wallet1).setApprovalForAll(wallet2Address, true);

            // wallet1 revokes approval
            await token.connect(wallet1).setApprovalForAll(wallet2Address, false);

            // wallet2 should not be able to burn
            await expect(
                token.connect(wallet2).burn(wallet1Address, 1, 100),
            ).to.be.reverted;
        });
    });

    describe("Supply Tracking", function () {
        it("Should track total supply correctly after burning", async function () {
            const wallet1Address = await wallet1.getAddress();
            const initialSupply = await token.totalSupply(1);

            await token.connect(wallet1).burn(wallet1Address, 1, 100);

            expect(await token.totalSupply(1)).to.equal(initialSupply - 100n);
            expect(await token.exists(1)).to.be.true; // Still exists since supply > 0
        });

        it("Should update exists status when all tokens are burned", async function () {
            const wallet2Address = await wallet2.getAddress();

            // Burn all tokens of ID 2
            await token.connect(wallet2).burn(wallet2Address, 2, 500);

            expect(await token.totalSupply(2)).to.equal(0);
            expect(await token.exists(2)).to.be.false;
        });
    });

    describe("Transfers", function () {
        it("Should transfer tokens normally", async function () {
            const wallet1Address = await wallet1.getAddress();
            const wallet2Address = await wallet2.getAddress();

            await token.connect(wallet1).safeTransferFrom(
                wallet1Address,
                wallet2Address,
                1,
                100,
                "0x"
            );

            expect(await token.balanceOf(wallet1Address, 1)).to.equal(900);
            expect(await token.balanceOf(wallet2Address, 1)).to.equal(100);
        });
    });
}); 