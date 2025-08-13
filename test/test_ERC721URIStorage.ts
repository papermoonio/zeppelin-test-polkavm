import { expect } from "chai";
import { ethers } from "hardhat";
import { Signer } from "ethers";
import { getWallets } from "./test_util";

describe("PVMERC721URIStorage", function () {
    let token: any;
    let owner: Signer;
    let wallet1: Signer;
    let wallet2: Signer;

    const name = "URI Storage NFT";
    const symbol = "URINFT";

    beforeEach(async function () {
        [owner, wallet1] = getWallets(2);
        wallet2 = ethers.Wallet.createRandom(ethers.getDefaultProvider());

        const ERC721URIStorageFactory = await ethers.getContractFactory("PVMERC721URIStorage", owner);

        token = await ERC721URIStorageFactory.deploy(name, symbol);
        await token.waitForDeployment();
    });

    describe("Deployment", function () {
        it("Should set the correct name and symbol", async function () {
            expect(await token.name()).to.equal(name);
            expect(await token.symbol()).to.equal(symbol);
        });

        it("Should set the deployer as owner", async function () {
            expect(await token.owner()).to.equal(await owner.getAddress());
        });
    });

    describe("Minting", function () {
        it("Should allow owner to mint tokens", async function () {
            const wallet1Address = await wallet1.getAddress();
            const txMint = await token.safeMint(wallet1Address);
            await txMint.wait();
            expect(await token.ownerOf(1)).to.equal(wallet1Address);
        });

        it("Should allow minting with custom URI", async function () {
            const wallet1Address = await wallet1.getAddress();
            const customURI = "https://example.com/token/1.json";

            const txMintWithURI = await token.safeMintWithURI(wallet1Address, customURI);
            await txMintWithURI.wait();

            expect(await token.ownerOf(1)).to.equal(wallet1Address);
            expect(await token.tokenURI(1)).to.equal(customURI);
        });

        it("Should prevent non-owner from minting", async function () {
            const wallet2Address = await wallet2.getAddress();
            await expect(token.connect(wallet1).safeMint(wallet2Address)).to.be.reverted;
        });
    });

    describe("URI Management", function () {
        beforeEach(async function () {
            const txMint1 = await token.safeMint(await wallet1.getAddress()); // Token 1
            await txMint1.wait();
            const txMint2 = await token.safeMint(await wallet2.getAddress()); // Token 2
            await txMint2.wait();
        });

        it("Should allow owner to set token URI", async function () {
            const customURI = "https://example.com/token/1.json";

            const txSetTokenURI = await token.setTokenURI(1, customURI);
            await txSetTokenURI.wait();
            expect(await token.tokenURI(1)).to.equal(customURI);
        });

        it("Should allow owner to set base URI", async function () {
            const baseURI = "https://example.com/metadata/";

            const txSetBaseURI = await token.setBaseURI(baseURI);
            await txSetBaseURI.wait();

            // Token without custom URI should use base URI + token ID
            expect(await token.tokenURI(1)).to.equal(baseURI + "1");
            expect(await token.tokenURI(2)).to.equal(baseURI + "2");
        });

        it("Should prioritize custom URI over base URI", async function () {
            const baseURI = "https://example.com/metadata/";
            const customURI = "https://custom.com/token/1.json";

            const txSetBaseURI = await token.setBaseURI(baseURI);
            await txSetBaseURI.wait();
            const txSetTokenURI = await token.setTokenURI(1, customURI);
            await txSetTokenURI.wait();

            // Token 1 should use custom URI
            expect(await token.tokenURI(1)).to.equal(baseURI + customURI);
            // Token 2 should use base URI
            expect(await token.tokenURI(2)).to.equal(baseURI + "2");
        });

        it("Should allow updating token URI", async function () {
            const firstURI = "https://example.com/token/1.json";
            const secondURI = "https://updated.com/token/1.json";

            const txSetTokenURI1 = await token.setTokenURI(1, firstURI);
            await txSetTokenURI1.wait();
            expect(await token.tokenURI(1)).to.equal(firstURI);

            const txSetTokenURI2 = await token.setTokenURI(1, secondURI);
            await txSetTokenURI2.wait();
            expect(await token.tokenURI(1)).to.equal(secondURI);
        });

        it("Should prevent setting URI for non-existent token", async function () {
            const customURI = "https://example.com/token/999.json";

            await expect(
                token.setTokenURI(999, customURI)
            ).to.be.reverted;
        });

        it("Should handle empty base URI", async function () {
            // Token without base URI and custom URI should return token ID
            expect(await token.tokenURI(1)).to.equal("");
        });

        it("Should handle empty custom URI", async function () {
            const baseURI = "https://example.com/metadata/";

            const txSetBaseURI = await token.setBaseURI(baseURI);
            await txSetBaseURI.wait();
            const txSetTokenURI = await token.setTokenURI(1, "");
            await txSetTokenURI.wait();

            // Empty custom URI should fall back to base URI behavior
            expect(await token.tokenURI(1)).to.equal(baseURI + "1");
        });
    });

    describe("Batch URI Operations", function () {
        beforeEach(async function () {
            // Mint multiple tokens
            for (let i = 1; i <= 5; i++) {
                const txMint = await token.safeMint(await wallet1.getAddress());
                await txMint.wait();
            }
        });

        it("Should handle multiple tokens with base URI", async function () {
            const baseURI = "https://example.com/metadata/";
            const txSetBaseURI = await token.setBaseURI(baseURI);
            await txSetBaseURI.wait();

            for (let i = 1; i <= 5; i++) {
                expect(await token.tokenURI(i)).to.equal(baseURI + i.toString());
            }
        });

        it("Should handle mix of base URI and custom URIs", async function () {
            const baseURI = "https://example.com/metadata/";
            const customURI1 = "https://custom.com/special/1.json";
            const customURI3 = "https://custom.com/special/3.json";

            const txSetBaseURI = await token.setBaseURI(baseURI);
            await txSetBaseURI.wait();
            const txSetTokenURI1 = await token.setTokenURI(1, customURI1);
            await txSetTokenURI1.wait();
            const txSetTokenURI3 = await token.setTokenURI(3, customURI3);
            await txSetTokenURI3.wait();

            expect(await token.tokenURI(1)).to.equal(baseURI + customURI1);
            expect(await token.tokenURI(2)).to.equal(baseURI + 2);
            expect(await token.tokenURI(3)).to.equal(baseURI + customURI3);
        });
    });

    describe("Token Existence", function () {
        beforeEach(async function () {
            const txMint = await token.safeMint(await wallet1.getAddress()); // Token 1
            await txMint.wait();
        });

        it("Should return true for existing tokens", async function () {
            expect(await token.exists(1)).to.be.true;
        });

        it("Should return false for non-existent tokens", async function () {
            expect(await token.exists(999)).to.be.false;
        });
    });

    describe("Access Control", function () {
        beforeEach(async function () {
            const txMint = await token.safeMint(await wallet1.getAddress()); // Token 1
            await txMint.wait();
        });

        it("Should prevent non-owner from setting token URI", async function () {
            const customURI = "https://example.com/token/1.json";

            await expect(
                token.connect(wallet1).setTokenURI(1, customURI)
            ).to.be.reverted;
        });

        it("Should prevent non-owner from setting base URI", async function () {
            const baseURI = "https://example.com/metadata/";

            await expect(
                token.connect(wallet1).setBaseURI(baseURI)
            ).to.be.reverted;
        });
    });

    describe("Standard ERC721 Functionality", function () {
        beforeEach(async function () {
            const txMint = await token.safeMint(await wallet1.getAddress());
            await txMint.wait();
        });

        it("Should transfer tokens correctly", async function () {
            const wallet1Address = await wallet1.getAddress();
            const wallet2Address = await wallet2.getAddress();

            const txTransfer = await token.connect(wallet1).transferFrom(wallet1Address, wallet2Address, 1);
            await txTransfer.wait();
            expect(await token.ownerOf(1)).to.equal(wallet2Address);
        });

        it("Should handle approvals correctly", async function () {
            const wallet1Address = await wallet1.getAddress();
            const wallet2Address = await wallet2.getAddress();

            const txApprove = await token.connect(wallet1).approve(wallet2Address, 1);
            await txApprove.wait();
            expect(await token.getApproved(1)).to.equal(wallet2Address);
        });
    });
}); 