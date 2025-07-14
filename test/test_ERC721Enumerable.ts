import { expect } from "chai";
import { ethers } from "hardhat";
import { Signer } from "ethers";

describe("PVMERC721Enumerable", function () {
    let token: any;
    let owner: Signer;
    let wallet1: Signer;
    let wallet2: Signer;

    const name = "Enumerable NFT";
    const symbol = "ENFT";

    beforeEach(async function () {
        [owner, wallet1] = await ethers.getSigners();
        wallet2 = ethers.Wallet.createRandom(ethers.getDefaultProvider());
        try {
            const ERC721EnumerableFactory = await ethers.getContractFactory("PVMERC721Enumerable");
            token = await ERC721EnumerableFactory.deploy(name, symbol);
            await token.waitForDeployment();
        } catch (error: any) {
            console.log("error is ", error);
        }

    });

    describe("Deployment", function () {
        it("Should set the correct name and symbol", async function () {
            expect(await token.name()).to.equal(name);
            expect(await token.symbol()).to.equal(symbol);
        });

        it("Should set the deployer as owner", async function () {
            expect(await token.owner()).to.equal(await owner.getAddress());
        });

        it("Should start with next token ID as 1", async function () {
            expect(await token.nextTokenId()).to.equal(1);
        });

        it("Should start with total supply of 0", async function () {
            expect(await token.totalSupply()).to.equal(0);
        });
    });

    describe("Single Minting", function () {
        it("Should allow owner to mint single token", async function () {
            const wallet1Address = await wallet1.getAddress();

            await token.mint(wallet1Address);

            expect(await token.ownerOf(1)).to.equal(wallet1Address);
            expect(await token.balanceOf(wallet1Address)).to.equal(1);
            expect(await token.totalSupply()).to.equal(1);
            expect(await token.nextTokenId()).to.equal(2);
        });

        it("Should prevent non-owner from minting", async function () {
            const wallet1Address = await wallet1.getAddress();

            await expect(
                token.connect(wallet1).mint(wallet1Address)
            ).to.be.reverted;
        });

        it("Should prevent minting to zero address", async function () {
            await expect(
                token.mint(ethers.ZeroAddress)
            ).to.be.reverted;
        });
    });

    describe("Batch Minting", function () {
        it("Should allow owner to mint multiple tokens", async function () {
            const wallet1Address = await wallet1.getAddress();
            const quantity = 5;

            await token.mintBatch(wallet1Address, quantity);

            expect(await token.balanceOf(wallet1Address)).to.equal(quantity);
            expect(await token.totalSupply()).to.equal(quantity);
            expect(await token.nextTokenId()).to.equal(quantity + 1);

            // Check that all tokens are owned by wallet1
            for (let i = 1; i <= quantity; i++) {
                expect(await token.ownerOf(i)).to.equal(wallet1Address);
            }
        });

        it("Should prevent non-owner from batch minting", async function () {
            const wallet1Address = await wallet1.getAddress();

            await expect(
                token.connect(wallet1).mintBatch(wallet1Address, 5)
            ).to.be.reverted;
        });

        it("Should prevent batch minting to zero address", async function () {
            await expect(
                token.mintBatch(ethers.ZeroAddress, 5)
            ).to.be.reverted;
        });

        it("Should prevent batch minting with zero quantity", async function () {
            const wallet1Address = await wallet1.getAddress();

            await expect(
                token.mintBatch(wallet1Address, 0)
            ).to.be.reverted;
        });

        it("Should prevent batch minting more than 100 tokens", async function () {
            const wallet1Address = await wallet1.getAddress();

            await expect(
                token.mintBatch(wallet1Address, 101)
            ).to.be.reverted;
        });
    });

    describe("Enumerable Functionality", function () {
        beforeEach(async function () {
            const wallet1Address = await wallet1.getAddress();
            const wallet2Address = await wallet2.getAddress();

            // Mint tokens to different addresses
            await token.mint(wallet1Address); // Token 1
            await token.mint(wallet2Address); // Token 2
            await token.mintBatch(wallet1Address, 3); // Tokens 3, 4, 5
            await token.mint(wallet2Address); // Token 6
        });

        it("Should return correct total supply", async function () {
            expect(await token.totalSupply()).to.equal(6);
        });

        it("Should return token by index", async function () {
            expect(await token.tokenByIndex(0)).to.equal(1);
            expect(await token.tokenByIndex(1)).to.equal(2);
            expect(await token.tokenByIndex(5)).to.equal(6);
        });

        it("Should fail when querying token by invalid index", async function () {
            await expect(token.tokenByIndex(6)).to.be.reverted; // Index out of bounds
        });

        it("Should return token of owner by index", async function () {
            const wallet1Address = await wallet1.getAddress();
            const wallet2Address = await wallet2.getAddress();

            // wallet1 owns tokens 1, 3, 4, 5 (4 tokens)
            expect(await token.tokenOfOwnerByIndex(wallet1Address, 0)).to.equal(1);
            expect(await token.tokenOfOwnerByIndex(wallet1Address, 1)).to.equal(3);
            expect(await token.tokenOfOwnerByIndex(wallet1Address, 2)).to.equal(4);
            expect(await token.tokenOfOwnerByIndex(wallet1Address, 3)).to.equal(5);

            // wallet2 owns tokens 2, 6 (2 tokens)
            expect(await token.tokenOfOwnerByIndex(wallet2Address, 0)).to.equal(2);
            expect(await token.tokenOfOwnerByIndex(wallet2Address, 1)).to.equal(6);
        });

        it("Should fail when querying token of owner by invalid index", async function () {
            const wallet1Address = await wallet1.getAddress();

            await expect(token.tokenOfOwnerByIndex(wallet1Address, 4)).to.be.reverted; // wallet1 only has 4 tokens (indices 0-3)
        });

        it("Should return all tokens of owner", async function () {
            const wallet1Address = await wallet1.getAddress();
            const wallet2Address = await wallet2.getAddress();

            const wallet1Tokens = await token.tokensOfOwner(wallet1Address);
            const wallet2Tokens = await token.tokensOfOwner(wallet2Address);

            expect(wallet1Tokens).to.deep.equal([1n, 3n, 4n, 5n]);
            expect(wallet2Tokens).to.deep.equal([2n, 6n]);
        });

        it("Should return empty array for address with no tokens", async function () {
            const ownerAddress = await owner.getAddress();
            const ownerTokens = await token.tokensOfOwner(ownerAddress);

            expect(ownerTokens).to.deep.equal([]);
        });
    });

    describe("Burning", function () {
        beforeEach(async function () {
            const wallet1Address = await wallet1.getAddress();
            await token.mintBatch(wallet1Address, 5); // Tokens 1-5
        });

        it("Should allow token owner to burn their token", async function () {
            const wallet1Address = await wallet1.getAddress();

            expect(await token.totalSupply()).to.equal(5);
            expect(await token.balanceOf(wallet1Address)).to.equal(5);

            await token.connect(wallet1).burn(3);

            expect(await token.totalSupply()).to.equal(4);
            expect(await token.balanceOf(wallet1Address)).to.equal(4);
            expect(await token.exists(3)).to.be.false;

            await expect(token.ownerOf(3)).to.be.reverted;
        });

        it("Should update enumeration after burning", async function () {
            const wallet1Address = await wallet1.getAddress();

            // Before burning: tokens 1, 2, 3, 4, 5
            let tokens = await token.tokensOfOwner(wallet1Address);
            expect(tokens).to.deep.equal([1n, 2n, 3n, 4n, 5n]);

            // Burn token 3
            await token.connect(wallet1).burn(3);

            // After burning: tokens 1, 2, 4, 5
            tokens = await token.tokensOfOwner(wallet1Address);
            expect(tokens).to.deep.equal([1n, 2n, 4n, 5n]);

            // Check tokenByIndex still works
            expect(await token.tokenByIndex(0)).to.equal(1);
            expect(await token.tokenByIndex(3)).to.equal(5); // Last token
        });

        it("Should prevent unauthorized burning", async function () {
            await expect(token.connect(wallet2).burn(1)).to.be.reverted;
        });
    });

    describe("URI Functionality", function () {
        it("Should allow owner to set base URI", async function () {
            const baseURI = "https://example.com/metadata/";

            await token.setBaseURI(baseURI);

            // Mint a token to test URI
            const wallet1Address = await wallet1.getAddress();
            await token.mint(wallet1Address);

            expect(await token.tokenURI(1)).to.equal(baseURI + "1");
        });

        it("Should prevent non-owner from setting base URI", async function () {
            await expect(
                token.connect(wallet1).setBaseURI("https://example.com/")
            ).to.be.reverted;
        });
    });

    describe("Standard ERC721 Functionality", function () {
        beforeEach(async function () {
            const wallet1Address = await wallet1.getAddress();
            await token.mintBatch(wallet1Address, 3);
        });

        it("Should transfer tokens correctly", async function () {
            const wallet1Address = await wallet1.getAddress();
            const wallet2Address = await wallet2.getAddress();

            await token.connect(wallet1).transferFrom(wallet1Address, wallet2Address, 2);

            expect(await token.ownerOf(2)).to.equal(wallet2Address);
            expect(await token.balanceOf(wallet1Address)).to.equal(2);
            expect(await token.balanceOf(wallet2Address)).to.equal(1);
        });

        it("Should handle approvals correctly", async function () {
            const wallet1Address = await wallet1.getAddress();
            const wallet2Address = await wallet2.getAddress();

            await token.connect(wallet1).approve(wallet2Address, 1);
            expect(await token.getApproved(1)).to.equal(wallet2Address);
        });

        it("Should support correct interfaces", async function () {
            // ERC721
            expect(await token.supportsInterface("0x80ac58cd")).to.be.true;
            // ERC721Enumerable
            expect(await token.supportsInterface("0x780e9d63")).to.be.true;
            // ERC165
            expect(await token.supportsInterface("0x01ffc9a7")).to.be.true;
        });
    });

    describe("Owner Functions", function () {
        it("Should allow owner to transfer ownership", async function () {
            const wallet1Address = await wallet1.getAddress();

            await token.connect(owner).transferOwnership(wallet1Address);
            expect(await token.owner()).to.equal(wallet1Address);
        });

        it("Should prevent non-owner from transferring ownership", async function () {
            const wallet2Address = await wallet2.getAddress();

            await expect(
                token.connect(wallet1).transferOwnership(wallet2Address)
            ).to.be.reverted;
        });
    });
}); 