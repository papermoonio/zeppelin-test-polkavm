import { expect } from "chai";
import { ethers } from "hardhat";
import { PVMERC721Burnable } from "../typechain-types/contracts/PVMERC721Burnable";
import { Signer } from "ethers";

describe("PVMERC721Burnable", function () {
    let token: PVMERC721Burnable;
    let owner: Signer;
    let wallet1: Signer;
    let wallet2: Signer;

    const name = "Burnable NFT";
    const symbol = "BNFT";

    beforeEach(async function () {
        [owner, wallet1] = getWallets(2);
        wallet2 = ethers.Wallet.createRandom(ethers.getDefaultProvider());

        const ERC721BurnableFactory = await ethers.getContractFactory("PVMERC721Burnable");
        token = await ERC721BurnableFactory.deploy(name, symbol);
        await token.waitForDeployment();

        // Mint some tokens for testing
        await token.safeMint(await owner.getAddress(), 1);
        await token.safeMint(await wallet1.getAddress(), 2);
        await token.safeMint(await wallet2.getAddress(), 3);
        await token.safeMint(await owner.getAddress(), 4);
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
            await token.safeMint(wallet1Address, 5);

            expect(await token.ownerOf(5)).to.equal(wallet1Address);
            expect(await token.balanceOf(wallet1Address)).to.equal(2);
        });

        it("Should prevent non-owner from minting", async function () {
            const wallet2Address = await wallet2.getAddress();
            await expect(
                token.connect(wallet1).safeMint(wallet2Address, 6)
            ).to.be.reverted;
        });
    });

    describe("Burning", function () {
        it("Should allow token owner to burn their token", async function () {
            const wallet1Address = await wallet1.getAddress();

            expect(await token.ownerOf(2)).to.equal(wallet1Address);
            await token.connect(wallet1).burn(2);

            await expect(token.ownerOf(2)).to.be.reverted;
        });

        it("Should allow approved address to burn token", async function () {
            const wallet1Address = await wallet1.getAddress();

            await token.connect(owner).approve(wallet1Address, 1);

            await token.connect(wallet1).burn(1);

            await expect(token.ownerOf(1)).to.be.reverted;
        });

        it("Should allow operator to burn token", async function () {
            const wallet1Address = await wallet1.getAddress();

            await token.connect(owner).setApprovalForAll(wallet1Address, true);

            await token.connect(wallet1).burn(4);

            await expect(token.ownerOf(4)).to.be.reverted;
        });

        it("Should prevent unauthorized burning", async function () {
            // wallet2 tries to burn token 1 (owned by owner) without approval
            await expect(token.connect(wallet1).burn(5)).to.be.reverted;
        });

        it("Should fail when trying to burn non-existent token", async function () {
            await expect(token.connect(owner).burn(999)).to.be.reverted;
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