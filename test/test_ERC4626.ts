import { expect } from "chai";
import { ethers } from "hardhat";
import { Signer } from "ethers";
import { PVMERC20 } from "../typechain-types/PVMERC20";
import { PVMERC4626 } from "../typechain-types/PVMERC4626";
import { getWallets } from "./test_util";

describe("PVMERC4626", function () {
    let vault: PVMERC4626;
    let asset: PVMERC20;
    let owner: Signer;
    let user: Signer;

    const name = "Vault Token";
    const symbol = "vTKN";
    const initialSupply = ethers.parseEther("10000");

    beforeEach(async function () {
        [owner, user] = getWallets(2);

        // Deploy the underlying ERC20 asset
        const ERC20Factory = await ethers.getContractFactory("PVMERC20");
        asset = await ERC20Factory.deploy("Underlying", "UND", initialSupply);
        await asset.waitForDeployment();

        // Deploy the ERC4626 vault
        const VaultFactory = await ethers.getContractFactory("PVMERC4626");
        try {
            vault = await VaultFactory.deploy(asset.getAddress(), name, symbol);
            await vault.waitForDeployment();
        } catch (error) {
            console.log(error)
        }

        // Transfer some asset tokens to user
        await asset.transfer(await user.getAddress(), ethers.parseEther("1000"));
    });

    it("Should deposit and mint shares", async function () {
        const depositAmount = ethers.parseEther("100");
        await asset.connect(user).approve(vault.getAddress(), depositAmount);

        // Deposit
        await expect(vault.connect(user).deposit(depositAmount, await user.getAddress()))
            .to.emit(vault, "Deposit")
            .withArgs(await user.getAddress(), await user.getAddress(), depositAmount, depositAmount);

        expect(await vault.balanceOf(await user.getAddress())).to.equal(depositAmount);
        expect(await asset.balanceOf(await user.getAddress())).to.equal(ethers.parseEther("900"));
        expect(await vault.totalAssets()).to.equal(depositAmount);

        // Mint
        const mintAmount = ethers.parseEther("50");
        await asset.connect(user).approve(vault.getAddress(), mintAmount);
        await expect(vault.connect(user).mint(mintAmount, await user.getAddress()))
            .to.emit(vault, "Deposit");
        expect(await vault.balanceOf(await user.getAddress())).to.equal(depositAmount.add(mintAmount));
    });

    it("Should withdraw and redeem shares", async function () {
        const depositAmount = ethers.parseEther("200");
        await asset.connect(user).approve(vault.getAddress(), depositAmount);
        await vault.connect(user).deposit(depositAmount, await user.getAddress());

        // Withdraw
        await expect(vault.connect(user).withdraw(ethers.parseEther("100"), await user.getAddress(), await user.getAddress()))
            .to.emit(vault, "Withdraw")
            .withArgs(await user.getAddress(), await user.getAddress(), await user.getAddress(), ethers.parseEther("100"), ethers.parseEther("100"));

        expect(await vault.balanceOf(await user.getAddress())).to.equal(ethers.parseEther("100"));
        expect(await asset.balanceOf(await user.getAddress())).to.equal(ethers.parseEther("900"));

        // Redeem
        await expect(vault.connect(user).redeem(ethers.parseEther("100"), await user.getAddress(), await user.getAddress()))
            .to.emit(vault, "Withdraw");
        expect(await vault.balanceOf(await user.getAddress())).to.equal(0);
        expect(await asset.balanceOf(await user.getAddress())).to.equal(ethers.parseEther("1000"));
    });

    it("Should not allow withdraw more than balance", async function () {
        const depositAmount = ethers.parseEther("50");
        await asset.connect(user).approve(vault.getAddress(), depositAmount);
        await vault.connect(user).deposit(depositAmount, await user.getAddress());

        await expect(
            vault.connect(user).withdraw(ethers.parseEther("100"), await user.getAddress(), await user.getAddress())
        ).to.be.reverted;
    });

    it("Should not allow redeem more than shares", async function () {
        const depositAmount = ethers.parseEther("50");
        await asset.connect(user).approve(vault.getAddress(), depositAmount);
        await vault.connect(user).deposit(depositAmount, await user.getAddress());

        await expect(
            vault.connect(user).redeem(ethers.parseEther("100"), await user.getAddress(), await user.getAddress())
        ).to.be.reverted;
    });
});