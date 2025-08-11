import { expect } from "chai";
import { ethers } from "hardhat";
import { PVMERC721Burnable } from "../typechain-types/contracts/PVMERC721Burnable";
import { Signer } from "ethers";
import { getWallets } from "./test_util";

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

        const ERC721BurnableFactory = await ethers.getContractFactory("PVMERC721Burnable", owner);
        token = await ERC721BurnableFactory.deploy(name, symbol);
        await token.waitForDeployment();

        // Mint some tokens for testing
        const txMint1 = await token.safeMint(await owner.getAddress(), 1);
        await txMint1.wait();
        const txMint2 = await token.safeMint(await wallet1.getAddress(), 2);
        await txMint2.wait();
        const txMint3 = await token.safeMint(await wallet2.getAddress(), 3);
        await txMint3.wait();
        const txMint4 = await token.safeMint(await owner.getAddress(), 4);
        await txMint4.wait();
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
            const txMint = await token.safeMint(wallet1Address, 5);
            await txMint.wait();

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
            const txBurn = await token.connect(wallet1).burn(2);
            await txBurn.wait();
            await expect(token.ownerOf(2)).to.be.reverted;
        });

        it("Should allow approved address to burn token", async function () {
            const wallet1Address = await wallet1.getAddress();

            const txApprove = await token.connect(owner).approve(wallet1Address, 1);
            await txApprove.wait();

            const txBurn = await token.connect(wallet1).burn(1);
            await txBurn.wait();

            await expect(token.ownerOf(1)).to.be.reverted;
        });

        it("Should allow operator to burn token", async function () {
            const wallet1Address = await wallet1.getAddress();

            const txApprove = await token.connect(owner).setApprovalForAll(wallet1Address, true);
            await txApprove.wait();

            const txBurn = await token.connect(wallet1).burn(4);
            await txBurn.wait();

        });

    });

    describe("Owner Functions", function () {
        it("Should allow owner to transfer ownership", async function () {
            const wallet1Address = await wallet1.getAddress();

            const txTransfer = await token.connect(owner).transferOwnership(wallet1Address);
            await txTransfer.wait();
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