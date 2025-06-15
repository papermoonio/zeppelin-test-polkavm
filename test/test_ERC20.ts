// filepath: test/token/ERC20.test.ts
import { expect } from "chai";
import { ethers, network } from "hardhat";
import { Contract, Signer } from "ethers";

import { PVMERC20 } from "../typechain-types/contracts/PVMERC20";

describe("PVMERC20", function () {
  // Test fixture with contract and signers
  let token: PVMERC20;
  let owner: Signer;
  let wallet1: Signer;
  let wallet2: Signer;

  const name = "Test Token";
  const symbol = "TST";
  const initialSupply = ethers.parseEther("10000");

  // Deploy a concrete implementation of the abstract ERC20 contract before each test
  before(async function () {
    [owner, wallet1] = await ethers.getSigners();
    wallet2 = ethers.Wallet.createRandom(ethers.getDefaultProvider());

    // Deploy a test implementation of ERC20
    const ERC20Factory = await ethers.getContractFactory("PVMERC20");
    token = await ERC20Factory.deploy(name, symbol, initialSupply);
    await token.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the correct name and symbol", async function () {
      expect(await token.name()).to.equal(name);
      expect(await token.symbol()).to.equal(symbol);
    });

    it("Should set decimals to 18", async function () {
      expect(await token.decimals()).to.equal(18);
    });

    it("Should assign the total supply of tokens to the owner", async function () {
      const ownerBalance = await token.balanceOf(await owner.getAddress());
      expect(await token.totalSupply()).to.equal(ownerBalance);
      expect(ownerBalance).to.equal(initialSupply);
    });
  });

  describe("Transactions", function () {
    it("Should transfer tokens between accounts", async function () {
      const amount = ethers.parseEther("100");
      const ownerAddress = await owner.getAddress();
      const wallet1Address = await wallet1.getAddress();

      // Transfer from owner to wallet1
      await token.transfer(wallet1Address, amount);

      // Check balances reflect the transfer
      expect(await token.balanceOf(wallet1Address)).to.equal(amount);
      expect(await token.balanceOf(ownerAddress)).to.equal(
        initialSupply - amount,
      );
    });

    it("Should update balances after transfers", async function () {
      const wallet1Address = await wallet1.getAddress();
      const wallet2Address = await wallet2.getAddress();
      const amount = await token.balanceOf(wallet1Address);

      await token.connect(wallet1).transfer(wallet2Address, amount / ethers.toBigInt(2));
      // Check balances
      expect(await token.balanceOf(wallet1Address)).to.equal(amount / ethers.toBigInt(2));
      expect(await token.balanceOf(wallet2Address)).to.equal(amount / ethers.toBigInt(2));
    });
  });

  describe("Allowance", function () {
    it("Should update allowance when approve is called", async function () {
      const amount = ethers.parseEther("100");
      const ownerAddress = await owner.getAddress();
      const allowanceWallet = ethers.Wallet.createRandom(ethers.getDefaultProvider());
      const allowanceWalletAddress = await allowanceWallet.getAddress();

      await token.approve(allowanceWalletAddress, amount);

      expect(await token.allowance(ownerAddress, allowanceWalletAddress)).to.equal(amount);
    });

    it("Should allow transferFrom with sufficient allowance", async function () {
      const amount = ethers.parseEther("100");
      const ownerAddress = await owner.getAddress();
      const wallet1Address = await wallet1.getAddress();
      const receiverWallet = ethers.Wallet.createRandom(ethers.getDefaultProvider());
      const receiverWalletAddress = await receiverWallet.getAddress();

      await token.approve(wallet1Address, amount);
      await token.connect(wallet1).transferFrom(ownerAddress, receiverWalletAddress, amount);

      expect(await token.balanceOf(receiverWalletAddress)).to.equal(amount);
      expect(await token.allowance(ownerAddress, wallet1Address)).to.equal(0);
    });

    it("Should not decrease allowance for over approval", async function () {

      const ownerAddress = await owner.getAddress();
      const wallet1Address = await wallet1.getAddress();
      const initialBalance = await token.balanceOf(ownerAddress);
      const amount = initialBalance + 1n;

      await token.approve(wallet1Address, amount);

      expect(await token.balanceOf(ownerAddress)).to.equal(initialBalance);
    });

    it("Should fail when trying to transferFrom more than allowed", async function () {
      const allowance = ethers.parseEther("99");
      const amount = ethers.parseEther("100");
      const ownerAddress = await owner.getAddress();
      const wallet1Address = await wallet1.getAddress();
      const wallet2Address = await wallet2.getAddress();

      await token.approve(wallet1Address, allowance);

      await expect(
        token.connect(wallet1).transferFrom(ownerAddress, wallet2Address, amount)
      ).to.be.reverted;
    });
  });


  describe("Edge cases", function () {
    it("Should fail when transferring to the zero address", async function () {
      const amount = ethers.parseEther("100");

      await expect(
        token.transfer(ethers.ZeroAddress, amount)
      ).to.be.reverted;
    });

    it("Should fail when approving the zero address as spender", async function () {
      const amount = ethers.parseEther("100");

      await expect(
        token.approve(ethers.ZeroAddress, amount)
      ).to.be.reverted;
    });

    it("Should handle zero value transfers correctly", async function () {
      const wallet1Address = await wallet1.getAddress();
      const initialBalance = await token.balanceOf(wallet1Address);

      await token.transfer(wallet1Address, 0);

      expect(await token.balanceOf(wallet1Address)).to.equal(initialBalance);
    });

    it("Should handle zero value approvals correctly", async function () {
      const wallet1Address = await wallet1.getAddress();

      await token.approve(wallet1Address, 0);

      expect(await token.allowance(await owner.getAddress(), wallet1Address)).to.equal(0);
    });
  });
});
