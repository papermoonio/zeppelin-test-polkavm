import { expect } from "chai";
import { ethers } from "hardhat";
import { Signer } from "ethers";

describe("PVMERC721Pausable", function () {
    let token: any;
    let owner: Signer;
    let wallet1: Signer;
    let wallet2: Signer;

    const name = "Pausable NFT";
    const symbol = "PNFT";

    beforeEach(async function () {
        [owner, wallet1] = await ethers.getSigners();
        wallet2 = ethers.Wallet.createRandom(ethers.getDefaultProvider());

        const ERC721PausableFactory = await ethers.getContractFactory("PVMERC721Pausable");
        token = await ERC721PausableFactory.deploy(name, symbol);
        await token.waitForDeployment();

        // Mint some tokens for testing
        await token.safeMint(await owner.getAddress());
        await token.safeMint(await wallet1.getAddress());
    });

    describe("Deployment", function () {
        it("Should set the correct name and symbol", async function () {
            expect(await token.name()).to.equal(name);
            expect(await token.symbol()).to.equal(symbol);
        });

        it("Should be unpaused by default", async function () {
            expect(await token.paused()).to.be.false;
        });

        it("Should set the deployer as owner", async function () {
            expect(await token.owner()).to.equal(await owner.getAddress());
        });
    });

    describe("Pausable functionality", function () {
        it("Should allow owner to pause and unpause", async function () {
            await token.pause();
            expect(await token.paused()).to.be.true;

            await token.unpause();
            expect(await token.paused()).to.be.false;
        });

        it("Should prevent transfers when paused", async function () {
            const ownerAddress = await owner.getAddress();
            const wallet2Address = await wallet2.getAddress();

            await token.pause();
            await expect(
                token.transferFrom(ownerAddress, wallet2Address, 1)
            ).to.be.reverted;
        });

        it("Should prevent minting when paused", async function () {
            const wallet2Address = await wallet2.getAddress();

            await token.pause();
            await expect(token.safeMint(wallet2Address)).to.be.reverted;
        });

        it("Should allow transfers after unpausing", async function () {
            const ownerAddress = await owner.getAddress();
            const wallet2Address = await wallet2.getAddress();

            await token.transferFrom(ownerAddress, wallet2Address, 1);
            expect(await token.ownerOf(1)).to.equal(wallet2Address);
        });

        it("Should prevent non-owner from pausing", async function () {
            await expect(token.connect(wallet1).pause()).to.be.reverted;
        });

        it("Should prevent non-owner from unpausing", async function () {
            await token.pause();
            await expect(token.connect(wallet1).unpause()).to.be.reverted;
        });

        it("Should emit Paused event when paused", async function () {
            await expect(token.pause())
                .to.emit(token, "Paused")
                .withArgs(await owner.getAddress());
        });

        it("Should emit Unpaused event when unpaused", async function () {
            await token.pause();
            await expect(token.unpause())
                .to.emit(token, "Unpaused")
                .withArgs(await owner.getAddress());
        });
    });

    describe("Minting", function () {
        it("Should allow owner to mint when unpaused", async function () {
            const wallet2Address = await wallet2.getAddress();
            const nextId = await token.nextTokenId();

            await token.safeMint(wallet2Address);
            expect(await token.ownerOf(nextId)).to.equal(wallet2Address);
        });

        it("Should prevent non-owner from minting", async function () {
            const wallet2Address = await wallet2.getAddress();
            await expect(token.connect(wallet1).safeMint(wallet2Address)).to.be.reverted;
        });
    });

    describe("Standard ERC721 Functionality", function () {
        it("Should transfer tokens when unpaused", async function () {
            const wallet1Address = await wallet1.getAddress();
            const wallet2Address = await wallet2.getAddress();

            await token.connect(wallet1).transferFrom(wallet1Address, wallet2Address, 2);
            expect(await token.ownerOf(2)).to.equal(wallet2Address);
        });

        it("Should handle approvals correctly", async function () {
            const wallet1Address = await wallet1.getAddress();
            const wallet2Address = await wallet2.getAddress();

            await token.connect(wallet1).approve(wallet2Address, 2);
            expect(await token.getApproved(2)).to.equal(wallet2Address);
        });
    });
}); 