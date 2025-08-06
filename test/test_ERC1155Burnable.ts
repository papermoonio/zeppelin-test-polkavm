import { expect } from "chai";
import { ethers } from "hardhat";
import { PVMERC1155Burnable } from "../typechain-types/contracts/PVMERC1155Burnable";
import { Signer } from "ethers";
import { getWallets } from "./test_util";
import { setMaxIdleHTTPParsers } from "http";

describe("PVMERC1155Burnable", function () {
    let token: PVMERC1155Burnable;
    let owner: Signer;
    let wallet1: Signer;
    let wallet2: Signer;

    const uri = "https://api.example.com/metadata/{id}.json";

    before(async function () {
        [owner, wallet1] = getWallets(2);
        wallet2 = ethers.Wallet.createRandom(ethers.getDefaultProvider());

        console.log("owner", await owner.getAddress());
        console.log("wallet1", await wallet1.getAddress());
        console.log("wallet2", await wallet2.getAddress());

        const ERC1155BurnableFactory = await ethers.getContractFactory("PVMERC1155Burnable", owner);
        token = await ERC1155BurnableFactory.deploy(uri);
        await token.waitForDeployment();

        // Mint some tokens for testing
        const wallet1Address = await wallet1.getAddress();
        const wallet2Address = await wallet2.getAddress();
        const txMint = await token.mint(wallet1Address, 1, 1000, "0x");
        await txMint.wait();
        const txMint2 = await token.mint(wallet2Address, 2, 500, "0x");
        await txMint2.wait();
        const txMintBatch = await token.mintBatch(wallet1Address, [3, 4], [300, 200], "0x");
        await txMintBatch.wait();
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
            const txMint = await token.mint(wallet1Address, 5, 100, "0x");
            await txMint.wait();

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

            const txBurn = await token.connect(wallet1).burn(wallet1Address, 1, 200);
            await txBurn.wait();

            expect(await token.balanceOf(wallet1Address, 1)).to.equal(initialBalance - 200n);
            expect(await token.totalSupply(1)).to.equal(initialSupply - 200n);
        });

        it("Should prevent burning more tokens than balance", async function () {
            const wallet1Address = await wallet1.getAddress();
            await expect(
                token.connect(wallet1).burn(wallet1Address, 1, 2000),
            ).to.be.reverted;
        });

        it("Should allow token holders to burn batch tokens", async function () {
            const wallet1Address = await wallet1.getAddress();
            const initialBalance3 = await token.balanceOf(wallet1Address, 3);
            const initialBalance4 = await token.balanceOf(wallet1Address, 4);
            const initialSupply3 = await token.totalSupply(3);
            const initialSupply4 = await token.totalSupply(4);

            const txBurnBatch = await token.connect(wallet1).burnBatch(wallet1Address, [3, 4], [50, 25]);
            await txBurnBatch.wait();

            expect(await token.balanceOf(wallet1Address, 3)).to.equal(initialBalance3 - 50n);
            expect(await token.balanceOf(wallet1Address, 4)).to.equal(initialBalance4 - 25n);
            expect(await token.totalSupply(3)).to.equal(initialSupply3 - 50n);
            expect(await token.totalSupply(4)).to.equal(initialSupply4 - 25n);
        });

    });



    describe("Supply Tracking", function () {
        it("Should track total supply correctly after burning", async function () {
            const wallet1Address = await wallet1.getAddress();
            const initialSupply = await token.totalSupply(1);

            const txBurn = await token.connect(wallet1).burn(wallet1Address, 1, 100);
            await txBurn.wait();

            expect(await token.totalSupply(1)).to.equal(initialSupply - 100n);
            expect(await token.exists(1)).to.be.true; // Still exists since supply > 0
        });
    });

    describe("Transfers", function () {
        it("Should transfer tokens normally", async function () {
            const wallet1Address = await wallet1.getAddress();
            const wallet2Address = await wallet2.getAddress();
            const initialBalance = await token.balanceOf(wallet1Address, 1);

            const txTransfer = await token.connect(wallet1).safeTransferFrom(
                wallet1Address,
                wallet2Address,
                1,
                100,
                "0x"
            );
            await txTransfer.wait();

            expect(initialBalance - 100n).to.equal(await token.balanceOf(wallet1Address, 1));
            expect(await token.balanceOf(wallet2Address, 1)).to.equal(100);
        });
    });
}); 