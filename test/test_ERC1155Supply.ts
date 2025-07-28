import { expect } from "chai";
import { ethers } from "hardhat";
import { PVMERC1155Supply } from "../typechain-types/contracts/PVMERC1155Supply";
import { Signer } from "ethers";

describe("PVMERC1155Supply", function () {
    let token: PVMERC1155Supply;
    let owner: Signer;
    let wallet1: Signer;
    let wallet2: Signer;

    const uri = "https://api.example.com/metadata/{id}.json";

    beforeEach(async function () {
        [owner, wallet1] = await ethers.getSigners();
        wallet2 = ethers.Wallet.createRandom(ethers.getDefaultProvider());

        try {
            const ERC1155SupplyFactory = await ethers.getContractFactory("PVMERC1155Supply");
            token = await ERC1155SupplyFactory.deploy(uri);
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
            expect(await token.totalSupply()).to.equal(0); // Total supply across all tokens
        });

        it("Should return false for exists on unminted tokens", async function () {
            expect(await token.exists(1)).to.be.false;
            expect(await token.exists(2)).to.be.false;
        });
    });

    describe("Single Token Supply Tracking", function () {
        it("Should track total supply when minting single tokens", async function () {
            const wallet1Address = await wallet1.getAddress();

            await token.mint(wallet1Address, 1, 100, "0x");

            expect(await token.totalSupply(1)).to.equal(100);
            expect(await token.totalSupply()).to.equal(100);
            expect(await token.exists(1)).to.be.true;
        });

        it("Should track total supply when minting to multiple addresses", async function () {
            const wallet1Address = await wallet1.getAddress();
            const wallet2Address = await wallet2.getAddress();

            await token.mint(wallet1Address, 1, 100, "0x");
            await token.mint(wallet2Address, 1, 50, "0x");

            expect(await token.totalSupply(1)).to.equal(150);
            expect(await token.totalSupply()).to.equal(150);
            expect(await token.balanceOf(wallet1Address, 1)).to.equal(100);
            expect(await token.balanceOf(wallet2Address, 1)).to.equal(50);
        });

        it("Should track total supply when burning single tokens", async function () {
            const wallet1Address = await wallet1.getAddress();

            await token.mint(wallet1Address, 1, 100, "0x");
            await token.burn(wallet1Address, 1, 30);

            expect(await token.totalSupply(1)).to.equal(70);
            expect(await token.totalSupply()).to.equal(70);
            expect(await token.exists(1)).to.be.true;
        });

        it("Should update exists status when all tokens are burned", async function () {
            const wallet1Address = await wallet1.getAddress();

            await token.mint(wallet1Address, 1, 100, "0x");
            await token.burn(wallet1Address, 1, 100);

            expect(await token.totalSupply(1)).to.equal(0);
            expect(await token.totalSupply()).to.equal(0);
            expect(await token.exists(1)).to.be.false;
        });
    });

    describe("Batch Supply Tracking", function () {
        it("Should track total supply when batch minting", async function () {
            const wallet1Address = await wallet1.getAddress();

            await token.mintBatch(wallet1Address, [1, 2, 3], [100, 200, 50], "0x");

            expect(await token.totalSupply(1)).to.equal(100);
            expect(await token.totalSupply(2)).to.equal(200);
            expect(await token.totalSupply(3)).to.equal(50);
            expect(await token.totalSupply()).to.equal(350); // Sum of all supplies
            expect(await token.exists(1)).to.be.true;
            expect(await token.exists(2)).to.be.true;
            expect(await token.exists(3)).to.be.true;
        });

        it("Should track total supply when batch burning", async function () {
            const wallet1Address = await wallet1.getAddress();

            await token.mintBatch(wallet1Address, [1, 2], [100, 200], "0x");
            await token.burnBatch(wallet1Address, [1, 2], [20, 50]);

            expect(await token.totalSupply(1)).to.equal(80);
            expect(await token.totalSupply(2)).to.equal(150);
            expect(await token.totalSupply()).to.equal(230);
        });

        it("Should handle partial batch burning", async function () {
            const wallet1Address = await wallet1.getAddress();

            await token.mintBatch(wallet1Address, [1, 2], [100, 200], "0x");
            await token.burnBatch(wallet1Address, [1, 2], [100, 50]);

            expect(await token.totalSupply(1)).to.equal(0);
            expect(await token.totalSupply(2)).to.equal(150);
            expect(await token.totalSupply()).to.equal(150);
            expect(await token.exists(1)).to.be.false;
            expect(await token.exists(2)).to.be.true;
        });
    });

    describe("Mixed Operations Supply Tracking", function () {
        it("Should track supply across mixed single and batch operations", async function () {
            const wallet1Address = await wallet1.getAddress();
            const wallet2Address = await wallet2.getAddress();

            // Single mint
            await token.mint(wallet1Address, 1, 100, "0x");
            expect(await token.totalSupply()).to.equal(100);

            // Batch mint
            await token.mintBatch(wallet2Address, [2, 3], [200, 50], "0x");
            expect(await token.totalSupply()).to.equal(350);

            // Single burn
            await token.burn(wallet1Address, 1, 30);
            expect(await token.totalSupply()).to.equal(320);

            // Batch burn
            await token.burnBatch(wallet2Address, [2, 3], [50, 25]);
            expect(await token.totalSupply()).to.equal(245);

            expect(await token.totalSupply(1)).to.equal(70);
            expect(await token.totalSupply(2)).to.equal(150);
            expect(await token.totalSupply(3)).to.equal(25);
        });

        it("Should maintain accurate supply after transfers", async function () {
            const wallet1Address = await wallet1.getAddress();
            const wallet2Address = await wallet2.getAddress();

            await token.mint(wallet1Address, 1, 100, "0x");
            const initialSupply = await token.totalSupply(1);
            const initialTotalSupply = await token.totalSupply();

            // Transfer doesn't change total supply
            await token.connect(wallet1).safeTransferFrom(
                wallet1Address,
                wallet2Address,
                1,
                30,
                "0x"
            );

            expect(await token.totalSupply(1)).to.equal(initialSupply);
            expect(await token.totalSupply()).to.equal(initialTotalSupply);
            expect(await token.balanceOf(wallet1Address, 1)).to.equal(70);
            expect(await token.balanceOf(wallet2Address, 1)).to.equal(30);
        });
    });

    describe("Multiple Token Types", function () {
        it("Should track supply independently for different token IDs", async function () {
            const wallet1Address = await wallet1.getAddress();

            await token.mint(wallet1Address, 1, 100, "0x");
            await token.mint(wallet1Address, 2, 200, "0x");
            await token.mint(wallet1Address, 3, 50, "0x");

            expect(await token.totalSupply(1)).to.equal(100);
            expect(await token.totalSupply(2)).to.equal(200);
            expect(await token.totalSupply(3)).to.equal(50);
            expect(await token.totalSupply()).to.equal(350);

            // Burn from one type shouldn't affect others
            await token.burn(wallet1Address, 2, 100);

            expect(await token.totalSupply(1)).to.equal(100);
            expect(await token.totalSupply(2)).to.equal(100);
            expect(await token.totalSupply(3)).to.equal(50);
            expect(await token.totalSupply()).to.equal(250);
        });

        it("Should handle exists correctly for multiple token types", async function () {
            const wallet1Address = await wallet1.getAddress();

            await token.mint(wallet1Address, 1, 100, "0x");
            await token.mint(wallet1Address, 2, 200, "0x");

            expect(await token.exists(1)).to.be.true;
            expect(await token.exists(2)).to.be.true;
            expect(await token.exists(3)).to.be.false;

            // Burn all of token 1
            await token.burn(wallet1Address, 1, 100);

            expect(await token.exists(1)).to.be.false;
            expect(await token.exists(2)).to.be.true;
            expect(await token.exists(3)).to.be.false;
        });
    });

    describe("Edge Cases", function () {
        it("Should handle zero amount minting", async function () {
            const wallet1Address = await wallet1.getAddress();

            await token.mint(wallet1Address, 1, 0, "0x");

            expect(await token.totalSupply(1)).to.equal(0);
            expect(await token.totalSupply()).to.equal(0);
            expect(await token.exists(1)).to.be.false;
        });

        it("Should prevent burning more than supply", async function () {
            const wallet1Address = await wallet1.getAddress();

            await token.mint(wallet1Address, 1, 100, "0x");

            await expect(
                token.burn(wallet1Address, 1, 150),
            ).to.be.reverted;
        });

        it("Should maintain accurate counts with large numbers", async function () {
            const wallet1Address = await wallet1.getAddress();
            const largeAmount = ethers.parseUnits("1000000", 18);

            await token.mint(wallet1Address, 1, largeAmount, "0x");

            expect(await token.totalSupply(1)).to.equal(largeAmount);
            expect(await token.totalSupply()).to.equal(largeAmount);

            await token.burn(wallet1Address, 1, largeAmount / 2n);

            expect(await token.totalSupply(1)).to.equal(largeAmount / 2n);
            expect(await token.totalSupply()).to.equal(largeAmount / 2n);
        });
    });

    describe("Access Control", function () {
        it("Should prevent non-owner from minting", async function () {
            const wallet1Address = await wallet1.getAddress();

            await expect(
                token.connect(wallet1).mint(wallet1Address, 1, 100, "0x"),
            ).to.be.reverted;
        });

        it("Should prevent non-owner from burning", async function () {
            const wallet1Address = await wallet1.getAddress();

            await token.mint(wallet1Address, 1, 100, "0x");

            await expect(
                token.connect(wallet1).burn(wallet1Address, 1, 50),
            ).to.be.reverted;
        });
    });
}); 