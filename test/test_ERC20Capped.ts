import { expect } from "chai";
import { ethers } from "hardhat";
import { PVMERC20Capped } from "../typechain-types/contracts/PVMERC20Capped";
import { Signer } from "ethers";

describe("PVMERC20Capped", function () {
    let token: PVMERC20Capped;
    let owner: Signer;
    let wallet1: Signer;

    const name = "Test Token";
    const symbol = "TST";
    const cap = ethers.parseEther("10000");

    before(async function () {
        [owner, wallet1] = getWallets(2);

        const ERC20CappedFactory = await ethers.getContractFactory("PVMERC20Capped");
        token = await ERC20CappedFactory.deploy(name, symbol, cap);
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
            expect(ownerBalance).to.equal(cap);
        });
    });

    describe("Cap functionality", function () {
        it("Should allow transfers within cap", async function () {
            const transferAmount = ethers.parseEther("100");
            const ownerAddress = await owner.getAddress();
            const wallet1Address = await wallet1.getAddress();

            await token.transfer(wallet1Address, transferAmount);
            expect(await token.balanceOf(wallet1Address)).to.equal(transferAmount);
            expect(await token.balanceOf(ownerAddress)).to.equal(cap - transferAmount);
        });

        it("Should maintain total supply at or below cap", async function () {
            expect(await token.totalSupply()).to.equal(cap);
        });
    });

}); 