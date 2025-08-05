import { expect } from "chai";
import { ethers } from "hardhat";
import { Signer } from "ethers";
import { getWallets } from "./test_util";
import { PVMERC20Burnable } from "../typechain-types/contracts/PVMERC20Burnable";

describe("PVMERC20Burnable", function () {
  let token: PVMERC20Burnable;
  let owner: Signer;
  let wallet1: Signer;
  let wallet2: Signer;

  const name = "Test Token";
  const symbol = "TST";
  const initialSupply = ethers.parseEther("10000");

  before(async function () {
    [owner, wallet1] = getWallets(2);
    wallet2 = ethers.Wallet.createRandom(ethers.getDefaultProvider());

    const ERC20Factory = await ethers.getContractFactory("PVMERC20Burnable", owner);
    token = await ERC20Factory.deploy(name, symbol, initialSupply);
    await token.waitForDeployment();
  });

  describe("Burn", function () {
    it("Should allow owner to burn their tokens", async function () {
      const burnAmount = ethers.parseEther("100");
      const ownerAddress = await owner.getAddress();
      const initialBalance = await token.balanceOf(ownerAddress);

      let burn = await token.connect(owner).burn(burnAmount);
      await burn.wait();

      expect(await token.balanceOf(ownerAddress)).to.equal(initialBalance - burnAmount);
      expect(await token.totalSupply()).to.equal(initialSupply - burnAmount);
    });

    it("Should allow approved spender to burn tokens", async function () {
      const burnAmount = ethers.parseEther("50");
      const ownerAddress = await owner.getAddress();
      const wallet1Address = await wallet1.getAddress();
      const initialBalance = await token.balanceOf(ownerAddress);

      let approve = await token.connect(owner).approve(wallet1Address, burnAmount);
      await approve.wait();
      let burnFrom = await token.connect(wallet1).burnFrom(ownerAddress, burnAmount);
      await burnFrom.wait();

      expect(await token.balanceOf(ownerAddress)).to.equal(initialBalance - burnAmount);
      expect(await token.totalSupply()).to.equal(initialSupply - burnAmount - ethers.parseEther("100"));
    });

    it("Should fail when trying to burn more tokens than owned", async function () {
      const wallet1Address = await wallet1.getAddress();
      const balance = await token.balanceOf(wallet1Address);
      const burnAmount = balance + ethers.parseEther("1");

      await expect(token.connect(wallet1).burn(burnAmount)).to.be.reverted;
    });
  });
});
