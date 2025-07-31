import { expect } from "chai";
import { ethers } from "hardhat";
import { PVMERC20Pausable } from "../typechain-types/contracts/PVMERC20Pausable";
import { Signer } from "ethers";

describe("PVMERC20Pausable", function () {
    let token: PVMERC20Pausable;
    let owner: Signer;
    let wallet1: Signer;
    let wallet2: Signer;

    const name = "Test Token";
    const symbol = "TST";
    const initialSupply = ethers.parseEther("10000");

    before(async function () {
        [owner, wallet1] = getWallets(2);
        wallet2 = ethers.Wallet.createRandom(ethers.getDefaultProvider());

        const ERC20PausableFactory = await ethers.getContractFactory("PVMERC20Pausable");
        token = await ERC20PausableFactory.deploy(name, symbol, initialSupply);
        await token.waitForDeployment();
    });

    describe("Deployment", function () {
        it("Should set the correct name and symbol", async function () {
            expect(await token.name()).to.equal(name);
            expect(await token.symbol()).to.equal(symbol);
        });

        it("Should assign the total supply to the owner", async function () {
            const ownerBalance = await token.balanceOf(await owner.getAddress());
            expect(await token.totalSupply()).to.equal(ownerBalance);
            expect(ownerBalance).to.equal(initialSupply);
        });

        it("Should be unpaused by default", async function () {
            expect(await token.paused()).to.be.false;
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
            const amount = ethers.parseEther("100");
            const wallet1Address = await wallet1.getAddress();

            await token.pause();
            await expect(token.transfer(wallet1Address, amount)).to.be.reverted;
        });

        it("Should prevent transferFrom when paused", async function () {
            const amount = ethers.parseEther("100");
            const ownerAddress = await owner.getAddress();
            const wallet1Address = await wallet1.getAddress();
            const wallet2Address = await wallet2.getAddress();
            await token.unpause();
            await token.approve(wallet1Address, amount);
            await token.pause();
            await expect(
                token.connect(wallet1).transferFrom(ownerAddress, wallet2Address, amount)
            ).to.be.reverted;
        });

        it("Should allow transfers after unpausing", async function () {
            const amount = ethers.parseEther("100");
            const wallet1Address = await wallet1.getAddress();

            await token.unpause();
            await token.transfer(wallet1Address, amount);
            expect(await token.balanceOf(wallet1Address)).to.equal(amount);
        });

        it("Should emit Paused event when paused", async function () {
            await expect(token.pause())
                .to.emit(token, "Paused")
                .withArgs(await owner.getAddress());
        });

        it("Should emit Unpaused event when unpaused", async function () {
            await expect(token.unpause())
                .to.emit(token, "Unpaused")
                .withArgs(await owner.getAddress());
        });
    });
}); 