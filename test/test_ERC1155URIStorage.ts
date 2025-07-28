import { expect } from "chai";
import { ethers } from "hardhat";
import { PVMERC1155URIStorage } from "../typechain-types/contracts/PVMERC1155URIStorage";
import { Signer } from "ethers";

describe("PVMERC1155URIStorage", function () {
    let token: PVMERC1155URIStorage;
    let owner: Signer;
    let wallet1: Signer;
    let wallet2: Signer;

    const baseUri = "https://api.example.com/metadata/";
    const defaultUri = "https://api.example.com/metadata/{id}.json";

    beforeEach(async function () {
        [owner, wallet1] = await ethers.getSigners();
        wallet2 = ethers.Wallet.createRandom(ethers.getDefaultProvider());

        try {
            const ERC1155URIStorageFactory = await ethers.getContractFactory("PVMERC1155URIStorage");
            token = await ERC1155URIStorageFactory.deploy(defaultUri);
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
        it("Should set the correct default URI", async function () {
            expect(await token.uri(1)).to.equal(defaultUri);
            expect(await token.uri(2)).to.equal(defaultUri);
            expect(await token.uri(100)).to.equal(defaultUri); // Non-existent token
        });

        it("Should set the deployer as owner", async function () {
            expect(await token.owner()).to.equal(await owner.getAddress());
        });
    });

    describe("Individual Token URI Management", function () {
        it("Should allow owner to set individual token URI", async function () {
            const tokenURI = "special-token-1.json";
            await token.setURI(1, tokenURI);

            expect(await token.uri(1)).to.equal(tokenURI);
            expect(await token.uri(2)).to.equal(defaultUri); // Other tokens unchanged
        });

        it("Should prevent non-owner from setting token URI", async function () {
            await expect(
                token.connect(wallet1).setURI(1, "unauthorized.json"),
            ).to.be.reverted;
        });

        it("Should emit URI event when setting token URI", async function () {
            const tokenURI = "special-token-1.json";
            await expect(token.setURI(1, tokenURI))
                .to.emit(token, "URI")
                .withArgs(tokenURI, 1);
        });

        it("Should allow setting empty token URI (reverts to default)", async function () {
            const tokenURI = "special-token-1.json";
            await token.setURI(1, tokenURI);
            expect(await token.uri(1)).to.equal(tokenURI);

            // Set empty URI to revert to default
            await token.setURI(1, "");
            expect(await token.uri(1)).to.equal(defaultUri);
        });

        it("Should handle multiple token URIs independently", async function () {
            await token.setURI(1, "token-1.json");
            await token.setURI(2, "token-2.json");
            await token.setURI(3, "token-3.json");

            expect(await token.uri(1)).to.equal("token-1.json");
            expect(await token.uri(2)).to.equal("token-2.json");
            expect(await token.uri(3)).to.equal("token-3.json");
            expect(await token.uri(4)).to.equal(defaultUri); // No specific URI set
        });
    });

    describe("Base URI Management", function () {
        it("Should allow owner to set base URI", async function () {
            await token.setBaseURI(baseUri);
            await token.setURI(1, "special-token-1.json");

            expect(await token.uri(1)).to.equal(baseUri + "special-token-1.json");
            expect(await token.uri(2)).to.equal(defaultUri); // Falls back to default URI
        });

        it("Should prevent non-owner from setting base URI", async function () {
            await expect(
                token.connect(wallet1).setBaseURI(baseUri),
            ).to.be.reverted;
        });

        it("Should concatenate base URI with token URI", async function () {
            await token.setBaseURI(baseUri);
            await token.setURI(1, "1.json");
            await token.setURI(2, "special/2.json");

            expect(await token.uri(1)).to.equal(baseUri + "1.json");
            expect(await token.uri(2)).to.equal(baseUri + "special/2.json");
        });

        it("Should handle empty base URI", async function () {
            await token.setBaseURI("");
            await token.setURI(1, "https://example.com/token1.json");

            expect(await token.uri(1)).to.equal("https://example.com/token1.json");
        });

        it("Should update existing token URIs when base URI changes", async function () {
            await token.setURI(1, "token-1.json");
            expect(await token.uri(1)).to.equal("token-1.json");

            await token.setBaseURI(baseUri);
            expect(await token.uri(1)).to.equal(baseUri + "token-1.json");

            await token.setBaseURI("https://newdomain.com/");
            expect(await token.uri(1)).to.equal("https://newdomain.com/token-1.json");
        });
    });

    describe("URI Fallback Behavior", function () {
        it("Should fallback to default URI when no specific URI is set", async function () {
            // Token with no specific URI should use default
            expect(await token.uri(999)).to.equal(defaultUri);
        });

        it("Should use specific URI when set, even if base URI is also set", async function () {
            await token.setBaseURI(baseUri);
            await token.setURI(1, "specific-1.json");

            expect(await token.uri(1)).to.equal(baseUri + "specific-1.json");
        });

        it("Should fallback properly when token URI is cleared", async function () {
            await token.setBaseURI(baseUri);
            await token.setURI(1, "specific-1.json");
            expect(await token.uri(1)).to.equal(baseUri + "specific-1.json");

            // Clear the specific URI
            await token.setURI(1, "");
            expect(await token.uri(1)).to.equal(defaultUri);
        });
    });

    describe("URI Management for Non-existent Tokens", function () {
        it("Should allow setting URI for non-existent tokens", async function () {
            await token.setURI(999, "non-existent.json");
            expect(await token.uri(999)).to.equal("non-existent.json");
        });

        it("Should handle base URI with non-existent tokens", async function () {
            await token.setBaseURI(baseUri);
            await token.setURI(999, "non-existent.json");
            expect(await token.uri(999)).to.equal(baseUri + "non-existent.json");
        });
    });

    describe("Token Operations with URI Storage", function () {
        it("Should maintain URI after minting additional tokens", async function () {
            await token.setURI(1, "special-1.json");
            const initialUri = await token.uri(1);

            const wallet1Address = await wallet1.getAddress();
            await token.mint(wallet1Address, 1, 500, "0x");

            expect(await token.uri(1)).to.equal(initialUri);
            expect(await token.balanceOf(wallet1Address, 1)).to.equal(1500);
        });

        it("Should maintain URI after burning tokens", async function () {
            await token.setURI(1, "special-1.json");
            const initialUri = await token.uri(1);

            const wallet1Address = await wallet1.getAddress();
            await token.burn(wallet1Address, 1, 200);

            expect(await token.uri(1)).to.equal(initialUri);
            expect(await token.balanceOf(wallet1Address, 1)).to.equal(800);
        });

        it("Should maintain URI after transferring tokens", async function () {
            await token.setURI(1, "special-1.json");
            const initialUri = await token.uri(1);

            const wallet1Address = await wallet1.getAddress();
            const wallet2Address = await wallet2.getAddress();

            await token.connect(wallet1).safeTransferFrom(
                wallet1Address,
                wallet2Address,
                1,
                100,
                "0x"
            );

            expect(await token.uri(1)).to.equal(initialUri);
            expect(await token.balanceOf(wallet1Address, 1)).to.equal(900);
            expect(await token.balanceOf(wallet2Address, 1)).to.equal(100);
        });

        it("Should maintain URI when all tokens are burned", async function () {
            await token.setURI(1, "special-1.json");
            const initialUri = await token.uri(1);

            const wallet1Address = await wallet1.getAddress();
            await token.burn(wallet1Address, 1, 1000); // Burn all tokens

            expect(await token.uri(1)).to.equal(initialUri);
            expect(await token.totalSupply(1)).to.equal(0);
            expect(await token.exists(1)).to.be.false;
        });
    });

    describe("Batch URI Operations", function () {
        it("Should handle URI for batch minted tokens", async function () {
            const wallet1Address = await wallet1.getAddress();
            await token.setBaseURI(baseUri);
            await token.setURI(5, "batch-5.json");
            await token.setURI(6, "batch-6.json");

            await token.mintBatch(wallet1Address, [5, 6], [100, 200], "0x");

            expect(await token.uri(5)).to.equal(baseUri + "batch-5.json");
            expect(await token.uri(6)).to.equal(baseUri + "batch-6.json");
            expect(await token.balanceOf(wallet1Address, 5)).to.equal(100);
            expect(await token.balanceOf(wallet1Address, 6)).to.equal(200);
        });
    });

    describe("Supply Tracking with URI Storage", function () {
        it("Should track supply correctly with URI operations", async function () {
            const wallet1Address = await wallet1.getAddress();

            await token.setURI(1, "tracked-1.json");
            expect(await token.totalSupply(1)).to.equal(1000);

            await token.mint(wallet1Address, 1, 500, "0x");
            expect(await token.totalSupply(1)).to.equal(1500);
            expect(await token.uri(1)).to.equal("tracked-1.json");
        });
    });
}); 